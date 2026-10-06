import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9335;
const userDataDir = path.join(process.cwd(), 'scratch', 'chrome_temp_verify');
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

// Capture screenshot 1: Initial page load / on refresh (NO skipped items, activities cover space)
const shot1 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/verify_refresh.png', Buffer.from(shot1.data, 'base64'));
console.log('Saved scratch/verify_refresh.png (simulating page load/refresh)');

// Now skip one item in this session by clicking the X on the first item
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const closeBtns = Array.from(document.querySelectorAll('button[title*="Skip this item"]'));
      if (closeBtns.length > 0) {
        closeBtns[0].click();
      }
    })()
  `
});

await sleep(600);

// Capture screenshot 2: After skipping in session (skipped items appear above line)
const shot2 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/verify_skipped_in_session.png', Buffer.from(shot2.data, 'base64'));
console.log('Saved scratch/verify_skipped_in_session.png');

ws.close();
chromeProc.kill();
process.exit(0);
