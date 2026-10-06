import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9350;
const userDataDir = path.join(process.cwd(), 'scratch', 'chrome_temp_measure_exact');

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

const res = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      const velH3 = h3s.find(h => h.textContent.includes('Velocity'));
      const velCard = velH3?.closest('.rounded-2xl');
      const vacBtn = Array.from(velCard?.querySelectorAll('button') || []).find(b => b.textContent.includes('Add Vacations'));
      const vacRect = vacBtn?.getBoundingClientRect();
      const velRect = velCard?.getBoundingClientRect();
      
      const workH3 = h3s.find(h => h.textContent.includes('Sprint Work Items'));
      const workCard = workH3?.closest('.rounded-2xl');
      const jiraBtn = Array.from(workCard?.querySelectorAll('button') || []).find(b => b.textContent.includes('Create Tickets in Jira'));
      const jiraRect = jiraBtn?.getBoundingClientRect();
      const workRect = workCard?.getBoundingClientRect();
      
      const cards = Array.from(workCard?.querySelectorAll('.overflow-y-auto > div') || []).filter(el => el.getAttribute('draggable') === 'true');
      const firstCardRect = cards[0]?.getBoundingClientRect();
      const lastCardRect = cards[cards.length - 1]?.getBoundingClientRect();

      const boardFilterEl = workCard?.querySelector('.inline-flex');
      const boardFilterRect = boardFilterEl?.getBoundingClientRect();

      return {
        velCard: {
          top: Math.round(velRect.top),
          bottom: Math.round(velRect.bottom),
          height: Math.round(velRect.height),
        },
        vacBtn: {
          top: Math.round(vacRect.top),
          bottom: Math.round(vacRect.bottom),
          height: Math.round(vacRect.height),
          spaceToVelBottom: Math.round(velRect.bottom - vacRect.bottom),
        },
        workCard: {
          top: Math.round(workRect.top),
          bottom: Math.round(workRect.bottom),
          height: Math.round(workRect.height),
        },
        jiraBtn: {
          top: Math.round(jiraRect.top),
          bottom: Math.round(jiraRect.bottom),
          height: Math.round(jiraRect.height),
          spaceToWorkBottom: Math.round(workRect.bottom - jiraRect.bottom),
          spaceFromLastCard: lastCardRect ? Math.round(jiraRect.top - lastCardRect.bottom) : null,
        },
        boardFilter: {
          bottom: Math.round(boardFilterRect?.bottom || 0),
          spaceToFirstCard: firstCardRect && boardFilterRect ? Math.round(firstCardRect.top - boardFilterRect.bottom) : null
        },
        cardsCount: cards.length,
        cardsHeights: cards.map(c => Math.round(c.offsetHeight))
      };
    })()
  `,
  returnByValue: true
});

console.log('DETAILED COMPARISON:', JSON.stringify(res.result?.value, null, 2));

ws.close();
chromeProc.kill();
process.exit(0);
