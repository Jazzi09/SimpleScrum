import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(process.cwd(), 'scratch', 'chrome_temp_six');

if (fs.existsSync(userDataDir)) {
  fs.rmSync(userDataDir, { recursive: true, force: true });
}
fs.mkdirSync(userDataDir, { recursive: true });

const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,950',
  'http://127.0.0.1:8000'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

await sleep(2000);
const res = await fetch('http://127.0.0.1:9225/json');
const tabs = await res.json();
const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
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

// Capture initial state screenshot
let shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/test_updated_view.png', Buffer.from(shot.data, 'base64'));
console.log('Saved scratch/test_updated_view.png');

// Now let's add an item using the UI to simulate 6 items, and skip one to simulate the user screenshot!
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('+ Add Item'));
      if (addBtn) addBtn.click();
    })()
  `
});

await sleep(500);

// In the modal, fill in title and click Add
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const titleInput = document.querySelector('input[placeholder*="theme" i], input[placeholder*="title" i], .fixed input[type="text"]');
      if (titleInput) {
        titleInput.value = 'sw';
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const submitBtn = Array.from(document.querySelectorAll('.fixed button')).find(b => b.textContent.includes('Add') || b.textContent.includes('Save') || b.textContent.includes('Create'));
      if (submitBtn) submitBtn.click();
    })()
  `
});

await sleep(600);

shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/test_six_items_view.png', Buffer.from(shot.data, 'base64'));
console.log('Saved scratch/test_six_items_view.png');

// Check scrollbar presence on work items container
const scrollCheck = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const container = document.querySelector('.overflow-y-auto');
      return {
        scrollHeight: container?.scrollHeight,
        clientHeight: container?.clientHeight,
        hasScrollbar: container?.scrollHeight > container?.clientHeight
      };
    })()
  `,
  returnByValue: true
});
console.log('Scroll check:', scrollCheck.result?.value);

ws.close();
chromeProc.kill();
process.exit(0);
