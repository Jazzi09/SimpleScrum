import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9224',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,950',
  'http://127.0.0.1:8000'
]);

await new Promise((r) => setTimeout(r, 2000));
const res = await fetch('http://127.0.0.1:9224/json');
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
await new Promise((r) => setTimeout(r, 1000));

// Click light mode toggle
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const themeBtn = btns.find(b => b.textContent.includes('Light') || b.textContent.includes('Dark'));
    if (themeBtn) themeBtn.click();
  `
});

await new Promise((r) => setTimeout(r, 600));

const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/test_light_mode.png', Buffer.from(shot.data, 'base64'));
console.log('Light mode screenshot saved');

ws.close();
chromeProc.kill();
process.exit(0);
