import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9336;
const userDataDir = path.join(process.cwd(), 'scratch', 'chrome_temp_adjust');
if (fs.existsSync(userDataDir)) {
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}
fs.mkdirSync(userDataDir, { recursive: true });

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,950',
  'http://127.0.0.1:8000'
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let connected = false;
let wsUrl = null;

for (let attempt = 0; attempt < 15; attempt++) {
  await sleep(500);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await res.json();
    const pageTab = tabs.find((t) => t.type === 'page');
    if (pageTab && pageTab.webSocketDebuggerUrl) {
      wsUrl = pageTab.webSocketDebuggerUrl;
      connected = true;
      break;
    }
  } catch (err) {}
}

if (!connected) {
  chromeProc.kill();
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));

let id = 1;
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const reqId = id++;
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === reqId) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: reqId, method, params }));
  });

await send('Page.enable');

// Wait for cards to render
for (let i = 0; i < 20; i++) {
  const check = await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('h3').length`,
    returnByValue: true
  });
  if (check.result?.value > 0) break;
  await sleep(300);
}

await sleep(1000);

const getMetrics = async () => {
  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        const velH3 = h3s.find(h => h.textContent.includes('Velocity'));
        const velCard = velH3?.closest('.rounded-2xl');
        const workH3 = h3s.find(h => h.textContent.includes('Sprint Work Items'));
        const workCard = workH3?.closest('.rounded-2xl');
        const distH3 = h3s.find(h => h.textContent.includes('SP Distribution'));
        const distCard = distH3?.closest('.rounded-2xl');
        
        const scrollArea = workCard?.querySelector('.overflow-y-auto');
        const cards = Array.from(scrollArea ? scrollArea.children : []).filter(el => el.getAttribute('draggable') === 'true');
        const jiraBtn = Array.from(workCard?.querySelectorAll('button') || []).find(b => b.textContent.includes('Create Tickets in Jira'));
        const jiraRect = jiraBtn?.getBoundingClientRect();
        const parentRect = workCard?.getBoundingClientRect();
        const lastCardRect = cards[cards.length - 1]?.getBoundingClientRect();
        const skippedEl = workCard ? Array.from(workCard.querySelectorAll('span')).find(s => s.textContent.includes('Skipped'))?.parentElement : null;
        const skippedRect = skippedEl?.getBoundingClientRect();

        return {
          velHeight: Math.round(velCard?.getBoundingClientRect().height || 0),
          workHeight: Math.round(workCard?.getBoundingClientRect().height || 0),
          distHeight: Math.round(distCard?.getBoundingClientRect().height || 0),
          cardCount: cards.length,
          cardHeights: cards.map(c => Math.round(c.getBoundingClientRect().height)),
          scrollAreaHeight: Math.round(scrollArea?.getBoundingClientRect().height || 0),
          scrollAreaScrollHeight: scrollArea?.scrollHeight || 0,
          hasScrollbar: scrollArea ? scrollArea.scrollHeight > scrollArea.clientHeight : false,
          distanceAboveBtn: lastCardRect && jiraRect ? Math.round(jiraRect.top - lastCardRect.bottom) : null,
          distanceBelowBtn: jiraRect && parentRect ? Math.round(parentRect.bottom - jiraRect.bottom) : null,
          skippedPresent: !!skippedEl,
          distanceSkippedToBtn: skippedRect && jiraRect ? Math.round(jiraRect.top - skippedRect.bottom) : null,
        };
      })()
    `,
    returnByValue: true
  });
  return res.result?.value;
};

console.log('5 items initial:', await getMetrics());

const shot1 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/five_items_adjusted.png', Buffer.from(shot1.data, 'base64'));

// Add 6th item
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('+ Add Item'));
      if (addBtn) addBtn.click();
    })()
  `
});
await sleep(500);

await send('Runtime.evaluate', {
  expression: `
    (() => {
      const modalInput = document.querySelector('.fixed input[placeholder="Item Title"]');
      if (modalInput) {
        const protoSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        protoSetter.call(modalInput, 'Task 6 Performance');
        modalInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const form = document.querySelector('.fixed form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    })()
  `
});
await sleep(1000);

console.log('6 items metrics:', await getMetrics());

const shot2 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/six_items_adjusted.png', Buffer.from(shot2.data, 'base64'));

ws.close();
chromeProc.kill();
process.exit(0);
