import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9340;
const userDataDir = path.join(process.cwd(), 'scratch', 'chrome_temp_flex');
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
await sleep(1500);

const measure = async (label) => {
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

await measure('Initial 5 cards');

// Apply flex styling to 5 cards
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const scrollArea = document.querySelector('.overflow-y-auto');
      scrollArea.style.display = 'flex';
      scrollArea.style.flexDirection = 'column';
      scrollArea.style.gap = '8px';
      const cards = Array.from(scrollArea.children).filter(el => el.getAttribute('draggable') === 'true');
      cards.forEach(c => {
        c.style.flex = '1 1 0%';
        c.style.display = 'flex';
        c.style.flexDirection = 'column';
        c.style.justifyContent = 'center';
        c.style.padding = '8px 14px';
        c.style.marginTop = '0px';
      });
    })()
  `
});
await sleep(300);
await measure('Flex 5 cards');
const shot1 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/flex_5_preview.png', Buffer.from(shot1.data, 'base64'));

// Add 6th item
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('+ Add Item'));
      if (addBtn) addBtn.click();
    })()
  `
});
await sleep(400);

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
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    })()
  `
});
await sleep(1000);

// Apply flex styling to 6 cards
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const scrollArea = document.querySelector('.overflow-y-auto');
      scrollArea.style.display = 'flex';
      scrollArea.style.flexDirection = 'column';
      scrollArea.style.gap = '6px';
      const cards = Array.from(scrollArea.children).filter(el => el.getAttribute('draggable') === 'true');
      cards.forEach(c => {
        c.style.flex = '1 1 0%';
        c.style.display = 'flex';
        c.style.flexDirection = 'column';
        c.style.justifyContent = 'center';
        c.style.padding = '6px 14px';
        c.style.marginTop = '0px';
      });
    })()
  `
});
await sleep(300);
await measure('Flex 6 cards');
const shot2 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/flex_6_preview.png', Buffer.from(shot2.data, 'base64'));

ws.close();
chromeProc.kill();
process.exit(0);
