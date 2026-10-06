import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9355;
const userDataDir = path.join(process.cwd(), 'scratch', 'chrome_temp_user_req');
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

const getMetrics = async (label) => {
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
        
        const scrollArea = workCard?.querySelector('.overflow-y-auto');
        const cards = Array.from(scrollArea?.querySelectorAll('div[draggable="true"]') || []);
        const firstCardRect = cards[0]?.getBoundingClientRect();
        const lastCardRect = cards[cards.length - 1]?.getBoundingClientRect();

        const boardFilterEl = workCard?.querySelector('.inline-flex');
        const boardFilterRect = boardFilterEl?.getBoundingClientRect();

        return {
          label: ${JSON.stringify(label)},
          vacSpaceBelow: Math.round(velRect.bottom - vacRect.bottom),
          jiraSpaceBelow: Math.round(workRect.bottom - jiraRect.bottom),
          jiraSpaceAbove: lastCardRect ? Math.round(jiraRect.top - lastCardRect.bottom) : null,
          boardFilterToFirstCardSpace: firstCardRect && boardFilterRect ? Math.round(firstCardRect.top - boardFilterRect.bottom) : null,
          cardCount: cards.length,
          cardHeights: cards.map(c => Math.round(c.offsetHeight)),
          scrollAreaHeight: Math.round(scrollArea?.clientHeight || 0),
          scrollAreaScrollHeight: Math.round(scrollArea?.scrollHeight || 0),
          hasScrollbar: scrollArea ? scrollArea.scrollHeight > scrollArea.clientHeight : false
        };
      })()
    `,
    returnByValue: true
  });
  console.log(res.result?.value);
  return res.result?.value;
};

// 1. Reset / set to 5 cards
const adjustCount = async (targetCount) => {
  let cur = await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('.overflow-y-auto div[draggable="true"]').length`,
    returnByValue: true
  });
  let count = cur.result?.value || 0;
  
  while (count > targetCount) {
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const deleteBtns = Array.from(document.querySelectorAll('button[title*="Skip this item"]'));
          if (deleteBtns.length > 0) deleteBtns[deleteBtns.length - 1].click();
        })()
      `
    });
    await sleep(600);
    const c = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.overflow-y-auto div[draggable="true"]').length`,
      returnByValue: true
    });
    count = c.result?.value || 0;
  }

  while (count < targetCount) {
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
            protoSetter.call(modalInput, 'Feature Task ' + Date.now().toString().slice(-4));
            modalInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          const form = document.querySelector('.fixed form');
          if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        })()
      `
    });
    await sleep(800);
    const c = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.overflow-y-auto div[draggable="true"]').length`,
      returnByValue: true
    });
    count = c.result?.value || 0;
  }
};

// Set to 5 and reload so clean state
await adjustCount(5);
await send('Page.reload');
await sleep(1500);

console.log('=== TEST 1: EXACTLY 5 ITEMS ===');
await getMetrics('5 Items');
const shot5 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/test_req_5_items.png', Buffer.from(shot5.data, 'base64'));

// Hover over first card and take screenshot to check highlight/clipping
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const firstCard = document.querySelector('.overflow-y-auto div[draggable="true"]');
      if (firstCard) {
        firstCard.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        firstCard.classList.add('hover:-translate-y-0.5', 'hover:shadow-md');
        firstCard.style.transform = 'translateY(-2px)';
      }
    })()
  `
});
await sleep(300);
const shotHover = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/test_req_hover_first_card.png', Buffer.from(shotHover.data, 'base64'));

console.log('=== TEST 2: EXACTLY 6 ITEMS ===');
await adjustCount(6);
await sleep(600);
await getMetrics('6 Items');
const shot6 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/test_req_6_items.png', Buffer.from(shot6.data, 'base64'));

console.log('=== TEST 3: EXACTLY 7 ITEMS (SCROLLBAR SHOULD APPEAR, MAX 6 VISIBLE) ===');
await adjustCount(7);
await sleep(600);
await getMetrics('7 Items');
const shot7 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/test_req_7_items.png', Buffer.from(shot7.data, 'base64'));

ws.close();
chromeProc.kill();
process.exit(0);
