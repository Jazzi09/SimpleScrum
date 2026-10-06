import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Clean temp dir
const userDataDir = path.join(process.cwd(), 'scratch', 'chrome_temp_clean');
if (fs.existsSync(userDataDir)) {
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}
fs.mkdirSync(userDataDir, { recursive: true });

const port = 9333;
const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,950',
  'http://127.0.0.1:8000'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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
  } catch (err) {
    // wait for next attempt
  }
}

if (!connected) {
  console.error('Failed to connect to Chrome on port ' + port);
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

// Capture screenshot
const shot1 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/current_planning.png', Buffer.from(shot1.data, 'base64'));
console.log('Saved scratch/current_planning.png');

// Add 7th item to verify scroll behavior and button spacing
await send('Runtime.evaluate', {
  expression: `
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('+ Add Item'));
    if (addBtn) addBtn.click();
  `
});
await sleep(400);

await send('Runtime.evaluate', {
  expression: `
    const modalInput = document.querySelector('.fixed input[type="text"]');
    if (modalInput) {
      modalInput.value = 'Extra Task 7';
      modalInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const modal = document.querySelector('.fixed');
    if (modal) {
      const modalBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.trim() === 'Add Item');
      if (modalBtn) modalBtn.click();
    }
  `
});
await sleep(1000);

const shot2 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/test_seven_items.png', Buffer.from(shot2.data, 'base64'));
console.log('Saved scratch/test_seven_items.png');

ws.close();
chromeProc.kill();
process.exit(0);
