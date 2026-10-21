(function () {
  'use strict';
  var CFG = window.SRT_CONFIG;
  var SECTIONS = ['Personal care', 'Mental growth', 'Physical growth'];
  var COLORS = { 'Personal care': '#4FC3FF', 'Mental growth': '#B98CFF', 'Physical growth': '#FF8A4C' };
  var STORE = 'srt.v1';
  // Same icon geometry as the desktop widget (24 x 24 box).
  var ICONS = {
    Wellness: 'M12,2 C10,6 4,11 4,16 A8,8 0 0 0 20,16 C20,11 14,6 12,2 Z',
    Care: 'M11,3 L12.8,9.2 19,11 12.8,12.8 11,19 9.2,12.8 3,11 9.2,9.2 Z M19,15 L19,22 M15.5,18.5 L22.5,18.5',
    Tooth: 'M7,3 C4,3 3,6 4,10 C5,13 6,15 6.5,19 C7,22 9,22 9.5,19 L10.5,15 C11,14 13,14 13.5,15 L14.5,19 C15,22 17,22 17.5,19 C18,15 19,13 20,10 C21,6 20,3 17,3 C15,3 14,4 12,4 C10,4 9,3 7,3 Z',
    Phone: 'M8,2 L16,2 Q18,2 18,4 L18,20 Q18,22 16,22 L8,22 Q6,22 6,20 L6,4 Q6,2 8,2 Z M11,18 L13,18',
    Headphones: 'M4,15 L4,12 A8,8 0 0 1 20,12 L20,15 M4,15 L7,15 L7,21 L4,21 Z M20,15 L17,15 L17,21 L20,21 Z',
    Course: 'M5,5 L19,5 L19,15 L5,15 Z M2,19 L22,19',
    Moon: 'M20,15 A9,9 0 1 1 10,4 A7,7 0 0 0 20,15 Z',
    Pill: 'M3.5,15.5 L15.5,3.5 A3.54,3.54 0 0 1 20.5,8.5 L8.5,20.5 A3.54,3.54 0 0 1 3.5,15.5 Z M9.5,9.5 L14.5,14.5',
    Block: 'M12,3 A9,9 0 1 1 11.99,3 M5.6,5.6 L18.4,18.4',
    Heat: 'M7,4 C5,7 9,9 7,12 C5,15 9,17 7,20 M12,4 C10,7 14,9 12,12 C10,15 14,17 12,20 M17,4 C15,7 19,9 17,12 C15,15 19,17 17,20',
    Movement: 'M14,2 A2,2 0 1 1 13.99,2 M12,8 L8,8 4,13 M12,8 L15,12 20,12 M12,8 L10,15 5,21 M10,15 L15,17 14,22',
    Strength: 'M2,12 L22,12 M5,8 L5,16 M8,5 L8,19 M16,5 L16,19 M19,8 L19,16',
    Learning: 'M12,5 C9,2 5,2 2,4 L2,21 C5,19 9,19 12,22 C15,19 19,19 22,21 L22,4 C19,2 15,2 12,5 Z M12,5 L12,22',
    Mindfulness: 'M12,3 C7,8 7,12 12,16 C17,12 17,8 12,3 Z M12,16 C8,10 3,10 2,12 C3,20 8,22 12,22 C16,22 21,20 22,12 C21,10 16,10 12,16 Z',
    Focus: 'M4,16 L16,4 21,9 9,21 3,22 Z M13,7 L18,12',
    Personal: 'M12,3 A9,9 0 1 1 11.99,3 M12,7 L12,17 M7,12 L17,12',
    check: 'M5,12 L10,17 20,7',
    star: 'M12,2 L14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6 Z',
    flame: 'M12,2 C13,6 18,8 18,14 A6,6 0 0 1 6,14 C6,10 9,9 9,6 C11,8 11,10 12,11 C13,9 13,5 12,2 Z',
    up: 'M5,15 L12,8 19,15', down: 'M5,9 L12,16 19,9', left: 'M15,5 L8,12 15,19', right: 'M9,5 L16,12 9,19',
    settings: 'M9,3 L15,3 16,6 19,7 22,11 20,14 20,18 16,20 14,23 10,23 8,20 4,18 4,14 2,11 5,7 8,6 Z M12,8 A5,5 0 1 1 11.99,8',
    sync: 'M20,12 A8,8 0 0 1 5.6,16.8 M4,12 A8,8 0 0 1 18.4,7.2 M18.4,3 L18.4,7.2 14.2,7.2 M5.6,21 L5.6,16.8 9.8,16.8',
    brand: 'M12,1 L22,10 12,23 2,10 Z M12,6 L12,18 18,11 Z'
  };

  // ---- Local store: the same records the server holds, plus what still needs pushing ----
  var db = load();
  var keyMatch = location.hash.match(/k=([A-Za-z0-9_-]{32,})/);
  if (keyMatch && keyMatch[1] !== db.key) { db = blank(); db.key = keyMatch[1]; save(); }
  var selected = today();
  var syncState = { busy: false, again: false, error: null, last: null };
  var ownerHash = null;
  var widgetSource = null;

  function blank() { return { key: null, items: {}, pending: {}, lastPull: null, collapsed: ['Mental growth', 'Physical growth'] }; }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(STORE)); if (s && s.items) return s; } catch (e) { }
    return blank();
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(db)); } catch (e) { } }

  // ---- Dates (local calendar days, matching the desktop's yyyy-MM-dd keys) ----
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function same(a, b) { return keyOf(a) === keyOf(b); }

  // ---- Habit model (mirrors HabitData.cs) ----
  function habits() {
    var list = [];
    Object.keys(db.items).forEach(function (k) {
      var it = db.items[k];
      if (it.kind === 'habit' && !it.deleted && it.data && it.data.n) {
        var d = it.data;
        list.push({ id: it.item_id, name: d.n, note: d.no || '', icon: d.c || 'Personal', section: SECTIONS.indexOf(d.s) >= 0 ? d.s : 'Personal care',
          schedule: d.sc || 'Every day', created: d.cr || keyOf(today()), kind: d.k || 'check', target: Math.max(1, d.t || 1), order: d.o || 0 });
      }
    });
    return list.sort(function (a, b) { return a.order - b.order; });
  }
  function dayRec(h, date) {
    var it = db.items['day:' + h.id + '|' + keyOf(date)];
    return it && !it.deleted && it.data ? { v: it.data.v || 0, b: !!it.data.b } : { v: 0, b: false };
  }
  function target(h) { return h.kind === 'count' ? h.target : 1; }
  function isDone(h, date) { return dayRec(h, date).v >= target(h); }
  function credit(h, date) {
    var r = dayRec(h, date), t = target(h);
    return r.v >= t ? 1 : (h.kind === 'count' ? r.v / t : 0);
  }
  function scheduled(h, date) {
    if (keyOf(date) < h.created) return false;
    var wd = date.getDay(), weekend = wd === 0 || wd === 6;
    return h.schedule === 'Weekdays' ? !weekend : h.schedule === 'Weekends' ? weekend : true;
  }
  function scheduledOn(date) { return habits().filter(function (h) { return scheduled(h, date); }); }
  function score(date) {
    var s = scheduledOn(date);
    if (!s.length) return null;
    return s.reduce(function (a, h) { return a + credit(h, date); }, 0) / s.length;
  }
  function pct(s) { return s === null ? '—' : Math.round(s * 100) + '%'; }
  function streak(h, asOf) {
    var day = asOf;
    if (scheduled(h, day) && !isDone(h, day)) day = addDays(day, -1);
    var n = 0;
    for (var i = 0; i < 3660 && keyOf(day) >= h.created; i++, day = addDays(day, -1)) {
      if (!scheduled(h, day)) continue;
      if (!isDone(h, day)) break;
      n++;
    }
    return n;
  }

  // One tap: check, add one to a counter, or step a workout through morning and off.
  function tap(h, date) {
    if (keyOf(date) > keyOf(today()) || !scheduled(h, date)) return;
    var r = dayRec(h, date), t = target(h);
    if (h.kind === 'count') r = { v: r.v >= t ? 0 : r.v + 1, b: false };
    else if (h.kind === 'workout') r = r.v < 1 ? { v: 1, b: false } : !r.b ? { v: 1, b: true } : { v: 0, b: false };
    else r = { v: r.v >= 1 ? 0 : 1, b: false };
    var k = 'day:' + h.id + '|' + keyOf(date);
    db.items[k] = { kind: 'day', item_id: h.id + '|' + keyOf(date), data: { v: r.v, b: r.b }, deleted: false, rev: Date.now() };
    db.pending[k] = true;
    save(); render(); syncSoon(600);
  }

  // ---- Sync with Supabase (push pending, then pull anything newer) ----
  function headers(extra) {
    var h = { apikey: CFG.key, 'x-sync-key': db.key, 'Content-Type': 'application/json' };
    if (CFG.key.indexOf('eyJ') === 0) h.Authorization = 'Bearer ' + CFG.key;
    for (var k in extra) h[k] = extra[k];
    return h;
  }
  function owner() {
    if (ownerHash) return Promise.resolve(ownerHash);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(db.key)).then(function (buf) {
      ownerHash = Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      return ownerHash;
    });
  }
  function rest(method, path, body, extra) {
    return fetch(CFG.url + '/rest/v1/' + path, { method: method, headers: headers(extra || {}), body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) {
          throw new Error('server said ' + r.status + ' ' + t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120));
        });
        return method === 'GET' ? r.json() : null;
      });
  }
  var syncTimer = null;
  function syncSoon(ms) { clearTimeout(syncTimer); syncTimer = setTimeout(sync, ms || 0); }
  function sync() {
    if (!db.key || !navigator.onLine) return Promise.resolve();
    if (syncState.busy) { syncState.again = true; return Promise.resolve(); }
    syncState.busy = true;
    var hadError = !!syncState.error;
    var sent = Object.keys(db.pending);
    var changed = false;
    return owner().then(function (o) {
      var rows = sent.map(function (k) {
        var it = db.items[k];
        return { owner: o, kind: it.kind, item_id: it.item_id, data: it.data || {}, deleted: !!it.deleted, rev: it.rev };
      });
      if (!rows.length) return;
      return rest('POST', 'sync_items?on_conflict=owner,kind,item_id', rows, { Prefer: 'resolution=merge-duplicates,return=minimal' })
        .then(function () {
          // Only clear what was sent and not changed again while the request was in flight.
          sent.forEach(function (k, i) { if (db.items[k].rev === rows[i].rev) delete db.pending[k]; });
          save();
        });
    }).then(function () { return pull(); }).then(function (n) {
      changed = n > 0;
      syncState.error = null; syncState.last = new Date();
    }).catch(function (e) {
      syncState.error = e.message || String(e);
    }).then(function () {
      syncState.busy = false;
      save();
      // Re-render when data arrived or the error state flipped, so the gear icon shows sync problems.
      if (changed || hadError !== !!syncState.error) render();
      if (syncState.again) { syncState.again = false; syncSoon(0); }
    });
  }
  function pull() {
    var applied = 0;
    function page(offset) {
      var q = 'sync_items?select=kind,item_id,data,deleted,rev,server_at&order=server_at.asc,item_id.asc&limit=1000&offset=' + offset;
      if (db.lastPull) q += '&server_at=gte.' + encodeURIComponent(db.lastPull);
      return rest('GET', q).then(function (rows) {
        rows.forEach(function (r) {
          var k = r.kind + ':' + r.item_id;
          if (!db.pending[k]) {
            var local = db.items[k];
            if (!local || r.rev >= local.rev) {
              var before = local ? JSON.stringify([local.data, local.deleted]) : null;
              db.items[k] = { kind: r.kind, item_id: r.item_id, data: r.data || {}, deleted: !!r.deleted, rev: r.rev };
              if (before !== JSON.stringify([db.items[k].data, db.items[k].deleted])) applied++;
            }
          }
          db.lastPull = r.server_at;
        });
        return rows.length === 1000 ? page(offset + 1000) : applied;
      });
    }
    return page(0);
  }

  // ---- Rendering ----
  function svg(name, color, size, filled) {
    var fill = filled || name === 'star' || name === 'flame' || name === 'brand';
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' + (fill ? color : 'none') + '" stroke="' + color +
      '" stroke-width="' + (fill ? 1.2 : 1.9) + '" stroke-linecap="round" stroke-linejoin="round"><path d="' + (ICONS[name] || ICONS.Personal) + '"/></svg>';
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function alpha(hex, a) { return hex + Math.round(a * 255).toString(16).padStart(2, '0'); }

  function ringSvg(list, date) {
    var n = list.length, r = 38, c = 46, w = 8, out = '';
    if (n <= 1) {
      var lit = n === 1 && credit(list[0], date) >= 1;
      return '<svg width="92" height="92"><circle cx="46" cy="46" r="38" fill="none" stroke="' + (lit ? COLORS[list[0].section] : 'rgba(255,255,255,.18)') + '" stroke-width="8"/></svg>';
    }
    var seg = Math.PI * 2 / n, gap = n <= 8 ? Math.min(w / r + 0.16, seg * 0.55) : Math.min(0.08, seg * 0.4), cap = n <= 8 ? 'round' : 'butt';
    list.forEach(function (h, i) {
      var s = -Math.PI / 2 + i * seg + gap / 2, e = s + seg - gap, cr = credit(h, date);
      var col = cr >= 1 ? COLORS[h.section] : cr > 0 ? alpha(COLORS[h.section], 0.5) : 'rgba(255,255,255,.18)';
      out += '<path d="M' + (c + r * Math.cos(s)).toFixed(2) + ',' + (c + r * Math.sin(s)).toFixed(2) + ' A' + r + ',' + r + ' 0 ' + (e - s > Math.PI ? 1 : 0) + ' 1 ' +
        (c + r * Math.cos(e)).toFixed(2) + ',' + (c + r * Math.sin(e)).toFixed(2) + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="' + cap + '"/>';
    });
    return '<svg width="92" height="92">' + out + '</svg>';
  }

  function render() {
    var app = document.getElementById('app');
    if (!db.key) { app.innerHTML = pairScreen(); bindPair(); return; }
    var t = today(), list = scheduledOn(selected), byOrder = [];
    SECTIONS.forEach(function (s) { list.forEach(function (h) { if (h.section === s) byOrder.push(h); }); });
    var done = list.filter(function (h) { return isDone(h, selected); }).length;
    var sc = score(selected), y = score(addDays(t, -1));
    var monday = addDays(selected, -((selected.getDay() + 6) % 7));
    var html = '<div class="wrap">';
    html += '<div class="hd"><div class="brand">' + svg('brand', COLORS['Personal care'], 18) + 'SHERB ROUTINE TRACKER</div>' +
      '<button class="icon-btn" data-act="settings" aria-label="Settings">' + svg(syncState.error ? 'sync' : 'settings', syncState.error ? '#FFB4A2' : 'rgba(255,255,255,.72)', 20) + '</button></div>';
    html += '<div class="hero"><div><div class="h1">Small steps.<br>Stronger days.</div>' +
      '<div class="date">' + selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + '</div>' +
      '<div class="badge"><small>YESTERDAY</small><b style="color:' + (y !== null && y >= 0.999 ? COLORS['Personal care'] : '#fff') + '">' + pct(y) + '</b></div></div>' +
      '<div class="ring">' + ringSvg(byOrder, selected) + '<div class="t"><b>' + pct(sc) + '</b><small>' + done + '/' + list.length + '</small></div></div></div>';
    html += '<div class="week">';
    for (var i = 0; i < 7; i++) {
      var d = addDays(monday, i), all = scheduledOn(d), full = all.length && all.every(function (h) { return isDone(h, d); });
      html += '<button class="day' + (same(d, selected) ? ' sel' : '') + (keyOf(d) > keyOf(t) && !same(d, selected) ? ' future' : '') + '" data-act="day" data-date="' + keyOf(d) + '">' +
        '<small>' + 'MTWTFSS'[i] + '</small><b>' + d.getDate() + '</b><i style="background:' + (full ? '#fff' : same(d, t) ? 'rgba(255,255,255,.6)' : 'transparent') + '"></i></button>';
    }
    html += '</div>';
    var when = same(selected, t) ? 'TODAY' : keyOf(selected) > keyOf(t) ? 'UPCOMING · READ-ONLY' : 'PAST DAY';
    if (list.length && done === list.length && keyOf(selected) <= keyOf(t)) when += ' · ALL DONE';
    html += '<div class="when"><span>' + when + '</span><span>' +
      '<button class="icon-btn" style="display:inline-grid;width:30px;height:24px" data-act="week" data-step="-7" aria-label="Previous week">' + svg('left', 'rgba(255,255,255,.72)', 16) + '</button>' +
      '<button class="icon-btn" style="display:inline-grid;width:30px;height:24px" data-act="week" data-step="7" aria-label="Next week">' + svg('right', 'rgba(255,255,255,.72)', 16) + '</button></span></div>';
    SECTIONS.forEach(function (s) {
      var hs = byOrder.filter(function (h) { return h.section === s; });
      if (!hs.length) return;
      var col = COLORS[s], n = hs.filter(function (h) { return isDone(h, selected); }).length;
      var cr = hs.reduce(function (a, h) { return a + credit(h, selected); }, 0);
      if (db.collapsed.indexOf(s) >= 0) {
        html += '<button class="folded" data-act="fold" data-sec="' + s + '" style="background:' + alpha(col, 0.14) + ';border-color:' + alpha(col, 0.36) + '">' +
          '<span class="sec-name" style="color:' + col + ';text-align:left">' + s.toUpperCase() + '</span>' +
          '<span class="bar"><i style="width:' + (100 * cr / hs.length) + '%;background:' + col + '"></i></span>' +
          '<span style="font-size:13px;font-weight:700;text-align:right">' + n + '/' + hs.length + '</span>' + svg('down', 'rgba(255,255,255,.72)', 13) + '</button>';
        return;
      }
      html += '<button class="sec-head" data-act="fold" data-sec="' + s + '"><span class="sec-name" style="color:' + col + '">' + s.toUpperCase() + '</span>' +
        '<span style="display:flex;align-items:center"><span class="pill" style="background:' + alpha(col, 0.18) + ';color:' + col + '">' + n + '/' + hs.length + '</span>' + svg('up', col, 13) + '</span></button>';
      hs.forEach(function (h) { html += card(h, col, t); });
    });
    if (!list.length) html += '<div class="empty">' + (habits().length ? 'No habits are scheduled for this day.' : 'Syncing your habits from your computer…') + '</div>';
    var q = window.SRT_QUOTES[quoteIndex(t)];
    html += '<div class="quote"><p>“' + esc(q[0]) + '”</p><small>' + esc(q[1]) + '</small></div></div>';
    app.innerHTML = html;
  }
  function quoteIndex(d) {
    var days = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 86400000);
    var n = window.SRT_QUOTES.length;
    return ((days % n) + n) % n;
  }
  function card(h, col, t) {
    var r = dayRec(h, selected), tg = target(h), done = r.v >= tg, morning = h.kind === 'workout' && done && r.b;
    var st = streak(h, keyOf(selected) > keyOf(t) ? t : selected), stText = st > 0 ? st + ' day streak' : 'Start your streak';
    var detail = h.kind === 'count' ? Math.min(r.v, tg) + ' of ' + tg + ' today · ' + stText
      : h.kind === 'workout' ? (morning ? 'Morning workout · ' + stText : done ? 'Tap again if it was a morning workout' : 'Tap twice for a morning workout')
      : (st > 0 ? stText : h.schedule + ' · ' + stText);
    var partial = h.kind === 'count' && !done && r.v > 0;
    var inner = done ? svg(morning ? 'star' : 'check', '#14101a', morning ? 15 : 16) : h.kind === 'count' ? (r.v + '/' + tg) : '';
    var circleStyle = done ? 'background:' + col : partial ? 'background:' + alpha(col, 0.25) + ';border-color:' + col : '';
    // The whole card is the tap target on a phone; the circle stays a real button for VoiceOver.
    var future = keyOf(selected) > keyOf(t);
    return '<div class="card' + (done ? ' done' : '') + '"' + (future ? '' : ' data-act="tap" data-id="' + h.id + '"') + '>' +
      '<div class="chip" style="background:' + alpha(col, 0.2) + '">' + svg(h.icon, col, 19) + '</div>' +
      '<div><div class="name">' + esc(h.name) + '</div><div class="sub">' + (morning ? svg('star', '#FF8A4C', 11) : '') + (st > 0 ? svg('flame', '#FF8A4C', 11) : '') + '<span>' + esc(detail) + '</span></div></div>' +
      '<button class="tap" data-act="tap" data-id="' + h.id + '"' + (future ? ' disabled' : '') + ' aria-label="' + esc(h.name) + '">' +
      '<span class="circle' + (done ? ' on' : '') + '" style="' + circleStyle + '">' + inner + '</span></button></div>';
  }

  function pairScreen() {
    return '<div class="wrap"><div class="hd"><div class="brand">' + svg('brand', COLORS['Personal care'], 18) + 'SHERB ROUTINE TRACKER</div></div>' +
      '<div class="empty" style="text-align:left;padding:30px 4px"><div class="h1" style="color:#fff;margin-bottom:12px">Connect your iPhone.</div>' +
      'On your computer, open the widget, click the gear, and choose <b style="color:#fff">Connect iPhone</b>. Scan the QR code it shows with your iPhone camera.<br><br>' +
      'Or paste the sync link here:<input class="code" id="code" placeholder="Paste sync link" autocomplete="off">' +
      '<button class="btn primary" data-act="paste">Connect</button></div></div>';
  }
  function bindPair() { }

  function settingsSheet() {
    var status = !navigator.onLine ? 'Offline. Changes will sync when you reconnect.' : syncState.error ? 'Sync problem: ' + esc(syncState.error) :
      syncState.last ? 'Synced at ' + syncState.last.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '.' : 'Syncing…';
    var pending = Object.keys(db.pending).length;
    var div = document.createElement('div');
    div.className = 'sheet-bg';
    div.innerHTML = '<div class="sheet"><h2>Sync and widget</h2><p>' + status + (pending ? ' ' + pending + ' change' + (pending > 1 ? 's' : '') + ' waiting to upload.' : '') + '</p>' +
      '<button class="btn" data-act="sync-now">Sync now</button>' +
      '<p style="margin-top:18px"><b style="color:#fff">Home-screen widget.</b> In the Scriptable app, tap + to make a new script, paste the widget script, and name it Sherb. Then add a Scriptable widget to your home screen, long-press it, choose Edit Widget, and pick Sherb as the script.</p>' +
      '<button class="btn primary" data-act="copy-widget">Copy widget script</button>' +
      '<p style="margin-top:18px">Add, rename, or reorder habits in the desktop widget. Changes appear here automatically.</p>' +
      '<button class="btn" data-act="close">Done</button></div>';
    document.body.appendChild(div);
  }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select();
    document.execCommand('copy'); a.remove(); return Promise.resolve();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) { if (e.target.classList.contains('sheet-bg')) e.target.remove(); return; }
    var act = b.getAttribute('data-act');
    if (act === 'tap') { var h = habits().filter(function (x) { return x.id === b.getAttribute('data-id'); })[0]; if (h) tap(h, selected); }
    else if (act === 'day') { var p = b.getAttribute('data-date').split('-'); selected = new Date(+p[0], +p[1] - 1, +p[2]); render(); }
    else if (act === 'week') { selected = addDays(selected, +b.getAttribute('data-step')); render(); }
    else if (act === 'fold') {
      var s = b.getAttribute('data-sec'), i = db.collapsed.indexOf(s);
      if (i >= 0) db.collapsed.splice(i, 1); else db.collapsed.push(s);
      save(); render();
    }
    else if (act === 'settings') { settingsSheet(); sync(); widgetScript().then(function (s) { widgetSource = s; }, function () { }); }
    else if (act === 'close') { document.querySelector('.sheet-bg').remove(); }
    else if (act === 'sync-now') { sync().then(function () { document.querySelector('.sheet-bg') && document.querySelector('.sheet-bg').remove(); toast(syncState.error ? 'Sync failed. Check your connection.' : 'Synced'); }); }
    else if (act === 'copy-widget') {
      // iOS only allows clipboard writes inside the tap itself, so the script is fetched when the sheet opens.
      if (!widgetSource) { toast('Still loading. Try again in a second.'); return; }
      copy(widgetSource).then(function () { toast('Widget script copied'); }, function () { toast('Could not copy the script.'); });
    }
    else if (act === 'paste') {
      var v = (document.getElementById('code').value || '').match(/k=([A-Za-z0-9_-]{32,})/) || (document.getElementById('code').value || '').trim().match(/^([A-Za-z0-9_-]{32,})$/);
      if (!v) { toast('That link does not look right.'); return; }
      db = blank(); db.key = v[1]; save(); render(); sync();
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      if (!same(selected, today()) && keyOf(selected) === keyOf(addDays(today(), -1))) selected = today();
      render(); sync();
    }
  });
  window.addEventListener('online', function () { sync(); });
  setInterval(function () { if (document.visibilityState === 'visible') sync(); }, 15000);

  function widgetScript() {
    return fetch('scriptable-widget.js', { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (src) {
      return src.replace('__URL__', CFG.url).replace('__KEY__', CFG.key).replace('__SYNC__', db.key).replace('__APP__', CFG.site + '#k=' + db.key);
    });
  }

  render();
  sync();
})();
