// Sherb Routine Tracker home-screen widget for the Scriptable app.
// Shows today's score ring, yesterday's score, and progress for each section.
const CFG = { url: "__URL__", key: "__KEY__", sync: "__SYNC__", app: "__APP__" };
const SECTIONS = ["Personal care", "Mental growth", "Physical growth"];
const COLORS = { "Personal care": "#4FC3FF", "Mental growth": "#B98CFF", "Physical growth": "#FF8A4C" };

function pad(n) { return (n < 10 ? "0" : "") + n; }
function keyOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function dayStart(offset) { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset); }

async function rest(query) {
  const req = new Request(CFG.url + "/rest/v1/sync_items?" + query);
  req.headers = { apikey: CFG.key, "x-sync-key": CFG.sync };
  if (CFG.key.indexOf("eyJ") === 0) req.headers.Authorization = "Bearer " + CFG.key;
  const rows = await req.loadJSON();
  if (!Array.isArray(rows)) throw new Error(JSON.stringify(rows));
  return rows;
}

async function load() {
  const today = dayStart(0), yesterday = dayStart(-1);
  const habitRows = await rest("select=item_id,data,deleted&kind=eq.habit");
  const days = [keyOf(today), keyOf(yesterday)];
  const dayRows = await rest("select=item_id,data,deleted&kind=eq.day&or=" +
    encodeURIComponent("(item_id.like.*|" + days[0] + ",item_id.like.*|" + days[1] + ")"));
  const records = {};
  dayRows.forEach(r => { if (!r.deleted) records[r.item_id] = r.data || {}; });
  const habits = habitRows.filter(r => !r.deleted && r.data && r.data.n).map(r => ({
    id: r.item_id, section: SECTIONS.indexOf(r.data.s) >= 0 ? r.data.s : "Personal care",
    created: r.data.cr || "0000-00-00", schedule: r.data.sc || "Every day",
    kind: r.data.k || "check", target: Math.max(1, r.data.t || 1), order: r.data.o || 0
  })).sort((a, b) => a.order - b.order);
  return { habits, records, today, yesterday };
}

function scheduled(h, date) {
  if (keyOf(date) < h.created) return false;
  const wd = date.getDay(), weekend = wd === 0 || wd === 6;
  return h.schedule === "Weekdays" ? !weekend : h.schedule === "Weekends" ? weekend : true;
}
function credit(h, date, records) {
  const r = records[h.id + "|" + keyOf(date)] || {}, t = h.kind === "count" ? h.target : 1, v = r.v || 0;
  return v >= t ? 1 : (h.kind === "count" ? v / t : 0);
}
function score(list, date, records) {
  if (!list.length) return null;
  return list.reduce((a, h) => a + credit(h, date, records), 0) / list.length;
}
function pct(s) { return s === null ? "—" : Math.round(s * 100) + "%"; }

function arc(ctx, cx, cy, r, from, to, color, width) {
  const p = new Path(), steps = Math.max(2, Math.ceil((to - from) / 0.05));
  for (let i = 0; i <= steps; i++) {
    const a = from + (to - from) * i / steps, pt = new Point(cx + r * Math.cos(a), cy + r * Math.sin(a));
    if (i === 0) p.move(pt); else p.addLine(pt);
  }
  ctx.setStrokeColor(color); ctx.setLineWidth(width); ctx.addPath(p); ctx.strokePath();
}

function ringImage(list, data, size) {
  const ctx = new DrawContext();
  ctx.size = new Size(size, size); ctx.opaque = false; ctx.respectScreenScale = true;
  const c = size / 2, w = size * 0.085, r = c - w;
  const ordered = [];
  SECTIONS.forEach(s => list.forEach(h => { if (h.section === s) ordered.push(h); }));
  const n = ordered.length, seg = Math.PI * 2 / Math.max(1, n), gap = n > 1 ? Math.min(0.08, seg * 0.4) : 0;
  if (n === 0) arc(ctx, c, c, r, 0, Math.PI * 2, new Color("#ffffff", 0.18), w);
  ordered.forEach((h, i) => {
    const cr = credit(h, data.today, data.records), s = -Math.PI / 2 + i * seg + gap / 2;
    const col = cr >= 1 ? new Color(COLORS[h.section]) : cr > 0 ? new Color(COLORS[h.section], 0.5) : new Color("#ffffff", 0.18);
    arc(ctx, c, c, r, s, s + seg - gap, col, w);
  });
  ctx.setFont(Font.boldSystemFont(size * 0.22)); ctx.setTextColor(Color.white()); ctx.setTextAlignedCenter();
  ctx.drawTextInRect(pct(score(list, data.today, data.records)), new Rect(0, c - size * 0.16, size, size * 0.3));
  ctx.setFont(Font.semiboldSystemFont(size * 0.11)); ctx.setTextColor(new Color("#ffffff", 0.7));
  const done = list.filter(h => credit(h, data.today, data.records) >= 1).length;
  ctx.drawTextInRect(done + "/" + list.length, new Rect(0, c + size * 0.1, size, size * 0.16));
  return ctx.getImage();
}

function barImage(fraction, color, width) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, 6); ctx.opaque = false; ctx.respectScreenScale = true;
  const track = new Path(); track.addRoundedRect(new Rect(0, 0, width, 6), 3, 3);
  ctx.setFillColor(new Color("#ffffff", 0.18)); ctx.addPath(track); ctx.fillPath();
  if (fraction > 0) {
    const fill = new Path(); fill.addRoundedRect(new Rect(0, 0, Math.max(6, width * fraction), 6), 3, 3);
    ctx.setFillColor(new Color(color)); ctx.addPath(fill); ctx.fillPath();
  }
  return ctx.getImage();
}

function label(stack, text, size, color, bold) {
  const t = stack.addText(text);
  t.font = bold ? Font.boldSystemFont(size) : Font.mediumSystemFont(size);
  t.textColor = color || Color.white();
  return t;
}

async function build() {
  const w = new ListWidget();
  const g = new LinearGradient();
  g.colors = [new Color("#2B2340"), new Color("#1E1A28")]; g.locations = [0, 1];
  w.backgroundGradient = g;
  w.url = CFG.app;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  const family = config.widgetFamily || "medium";
  let data;
  try { data = await load(); }
  catch (e) {
    label(w, "SHERB", 11, new Color("#ffffff", 0.7), true); w.addSpacer(6);
    label(w, "Couldn't sync. Will try again soon.", 12, Color.white(), false);
    return w;
  }
  const todayList = data.habits.filter(h => scheduled(h, data.today));
  const yList = data.habits.filter(h => scheduled(h, data.yesterday));
  const y = score(yList, data.yesterday, data.records);

  if (family === "small") {
    w.setPadding(12, 12, 12, 12);
    const top = w.addStack(); top.addSpacer();
    top.addImage(ringImage(todayList, data, 92)).imageSize = new Size(92, 92);
    top.addSpacer();
    w.addSpacer(6);
    const row = w.addStack(); row.addSpacer();
    label(row, "YESTERDAY ", 10, new Color("#ffffff", 0.7), true);
    label(row, pct(y), 12, y !== null && y >= 0.999 ? new Color(COLORS["Personal care"]) : Color.white(), true);
    row.addSpacer();
    return w;
  }

  w.setPadding(14, 14, 14, 16);
  const main = w.addStack(); main.layoutHorizontally(); main.centerAlignContent();
  main.addImage(ringImage(todayList, data, 108)).imageSize = new Size(108, 108);
  main.addSpacer(16);
  const right = main.addStack(); right.layoutVertically();
  const head = right.addStack(); head.centerAlignContent();
  label(head, "SHERB ROUTINE", 10, new Color("#ffffff", 0.7), true); head.addSpacer();
  label(head, "YDAY ", 9, new Color("#ffffff", 0.6), true);
  label(head, pct(y), 12, y !== null && y >= 0.999 ? new Color(COLORS["Personal care"]) : Color.white(), true);
  right.addSpacer(8);
  SECTIONS.forEach((s, i) => {
    const hs = todayList.filter(h => h.section === s);
    if (!hs.length) return;
    const cr = hs.reduce((a, h) => a + credit(h, data.today, data.records), 0);
    const done = hs.filter(h => credit(h, data.today, data.records) >= 1).length;
    const row = right.addStack(); row.centerAlignContent();
    label(row, s.toUpperCase(), 9.5, new Color(COLORS[s]), true); row.addSpacer();
    label(row, done + "/" + hs.length, 11, Color.white(), true);
    right.addSpacer(3);
    right.addImage(barImage(cr / hs.length, COLORS[s], 150)).imageSize = new Size(150, 6);
    if (i < SECTIONS.length - 1) right.addSpacer(7);
  });
  return w;
}

const widget = await build();
if (config.runsInWidget) Script.setWidget(widget);
else if ((config.widgetFamily || "medium") === "small") await widget.presentSmall();
else await widget.presentMedium();
Script.complete();
