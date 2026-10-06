import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9346;
const userDataDir = path.join(process.cwd(), 'scratch', 'chrome_temp_five_six');
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

for (let attempt = 0; attempt < 20; attempt++) {
  await sleep(400);
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
await sleep(1500);

// Ensure we have exactly 5 items
const checkAndReduceTo5 = async () => {
  const countRes = await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('.overflow-y-auto > div[draggable="true"]').length`,
    returnByValue: true
  });
  let count = countRes.result?.value || 0;
  while (count > 5) {
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const deleteButtons = Array.from(document.querySelectorAll('button[title*="Skip this item"]'));
          if (deleteButtons.length > 0) deleteButtons[0].click();
        })()
      `
    });
    await sleep(800);
    const newCountRes = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.overflow-y-auto > div[draggable="true"]').length`,
      returnByValue: true
    });
    count = newCountRes.result?.value || 0;
  }
};

await checkAndReduceTo5();

// Reload page so skipped is cleared
await send('Page.reload');
await sleep(1500);

const getMetrics = async (label) => {
  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const scrollArea = document.querySelector('.overflow-y-auto');
        const workCard = scrollArea?.closest('.rounded-2xl');
        const cards = Array.from(scrollArea ? scrollArea.children : []).filter(el => el.getAttribute('draggable') === 'true');
        const jiraBtn = Array.from(workCard?.querySelectorAll('button') || []).find(b => b.textContent.includes('Create Tickets in Jira'));
        const jiraRect = jiraBtn?.getBoundingClientRect();
        const parentRect = workCard?.getBoundingClientRect();
        const lastCardRect = cards[cards.length - 1]?.getBoundingClientRect();
        return {
          label: ${JSON.stringify(label)},
          cardCount: cards.length,
          cardHeights: cards.map(c => Math.round(c.getBoundingClientRect().height)),
          scrollAreaHeight: Math.round(scrollArea?.getBoundingClientRect().height || 0),
          scrollAreaScrollHeight: scrollArea?.scrollHeight || 0,
          hasScrollbar: scrollArea ? scrollArea.scrollHeight > scrollArea.clientHeight : false,
          distanceAboveBtn: lastCardRect && jiraRect ? Math.round(jiraRect.top - lastCardRect.bottom) : null,
          distanceBelowBtn: jiraRect && parentRect ? Math.round(parentRect.bottom - jiraRect.bottom) : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log(res.result?.value);
};

console.log('--- TESTING 5 ITEMS ---');
await getMetrics('Exactly 5 items');
const shot5 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/verified_5_items_exact.png', Buffer.from(shot5.data, 'base64'));

console.log('--- ADDING 6TH ITEM ---');
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
        protoSetter.call(modalInput, 'Automated CI/CD Pipeline');
        modalInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const form = document.querySelector('.fixed form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    })()
  `
});
await sleep(1200);

console.log('--- TESTING 6 ITEMS ---');
await getMetrics('Exactly 6 items (scaled down)');
const shot6 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/verified_6_items_exact.png', Buffer.from(shot6.data, 'base64'));

ws.close();
chromeProc.kill();
process.exit(0);
