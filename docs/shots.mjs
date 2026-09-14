/* Redraw the README screenshots so they can't drift from the app.
   Serve the repo root on :8097 first, e.g. `npx http-server -p 8097 .`,
   then: node docs/shots.mjs   (needs playwright)

   Dates are computed from today, so the counts stay sensible whenever
   this is re-run. */
import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:8097/index.html';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport:{ width:390, height:844 }, deviceScaleFactor:2 })).newPage();

await p.goto(URL);
await p.waitForTimeout(800);

await p.evaluate(async () => {
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const inDays = n => { const d = new Date(); d.setDate(d.getDate()+n); return iso(d); };
  // start from empty every run so re-shooting never stacks duplicates
  for (const e of await loadEvents()) await delEvent(e.id);
  const rows = [
    { title:'Japan',             date: inDays(41),    time:'06:30', repeat:'none' },
    { title:'Anniversary',       date: inDays(92),    time:null,    repeat:'year' },
    { title:'Valencia Marathon', date: inDays(174),   time:null,    repeat:'none' },
    { title:'Stopped smoking',   date: inDays(-4218), time:null,    repeat:'none' },
  ];
  for (const r of rows) {
    await putEvent({ id: crypto.randomUUID(), note:'', image:null, alert:false, marked:[],
                     created: Date.now() - 86400000*30, ...r });
  }
  await refresh();
});
await p.waitForTimeout(500);

// Clip to a clean edge just under the second card, rather than ending the
// shot halfway through a third one.
const hCount = await p.evaluate(() => {
  const cards = document.querySelectorAll('#focusWrap .focus');
  return Math.round((cards[1] || cards[0]).getBoundingClientRect().bottom + window.scrollY + 9);
});
await p.screenshot({ path:'docs/count.png', clip:{ x:0, y:0, width:390, height:hCount } });

await p.evaluate(() => show('events'));
await p.waitForTimeout(400);
const hEvents = await p.evaluate(() => {
  const rows = document.querySelectorAll('#list > *');
  return Math.round(rows[rows.length-1].getBoundingClientRect().bottom + window.scrollY + 20);
});
await p.screenshot({ path:'docs/events.png', clip:{ x:0, y:0, width:390, height:hEvents } });

await b.close();
