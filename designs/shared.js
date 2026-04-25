(function() {
  'use strict';

  const CURRENT_SEASON = 2026;
  const LAST_SEASON = 2025;
  const STORAGE_KEY = 'fred-wright-v6';
  const SLOT_CAP = 60;
  const SEASONS = [LAST_SEASON, CURRENT_SEASON];
  const LIST_IDS = ['participants', 'deferred', 'waitlist', 'new'];
  const DEFAULT_COLUMN_ORDER = ['new', 'waitlist', 'participants', 'deferred'];
  const GRIP_SVG =
    '<svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor" aria-hidden="true">' +
      '<circle cx="2" cy="3" r="1"/><circle cx="6" cy="3" r="1"/>' +
      '<circle cx="2" cy="7" r="1"/><circle cx="6" cy="7" r="1"/>' +
      '<circle cx="2" cy="11" r="1"/><circle cx="6" cy="11" r="1"/>' +
    '</svg>';

  function getDeferSeasons(player) {
    return (player.history || [])
      .filter(h => (h.type === 'defer' || h.type === 'decline') && h.season)
      .map(h => Number(h.season));
  }

  function listDisplayName(listId, year) {
    switch (listId) {
      case 'participants': return year + ' Participants';
      case 'deferred':
        return 'Deferred in ' + year;
      case 'waitlist':     return 'Waitlist';
      case 'new':          return 'New Signups ' + year;
    }
    return listId;
  }

  const IMPORT_OPEN_ISO = '2026-01-04T08:00:00';
  const IMPORT_PAYLOAD = [
    { name: 'Aronson, Mark',     timestamp: '2026-01-04T08:00:00' },
    { name: 'Belmonte, Tony',    timestamp: '2026-01-04T08:00:01' },
    { name: 'Carrera, Steve',    timestamp: '2026-01-04T08:00:03' },
    { name: 'DiMauro, Frank',    timestamp: '2026-01-04T08:00:04' },
    { name: 'Egan, Patrick',     timestamp: '2026-01-04T08:00:06' },
    { name: 'Fagnant, Joe',      timestamp: '2026-01-04T08:00:08' },
    { name: 'Galante, Vinny',    timestamp: '2026-01-04T08:00:10' },
    { name: 'Hartigan, Sean',    timestamp: '2026-01-04T08:00:12' },
    { name: 'Iannelli, Rich',    timestamp: '2026-01-04T08:00:14' },
    { name: 'Jeong, Min',        timestamp: '2026-01-04T08:00:16' },
    { name: 'Keenan, Tom',       timestamp: '2026-01-04T08:00:18' },
    { name: 'Lavoie, Pete',      timestamp: '2026-01-04T08:00:19' },
    { name: 'Mancuso, Carl',     timestamp: '2026-01-04T08:00:22' },
    { name: 'Nardone, Dom',      timestamp: '2026-01-04T08:00:25' },
    { name: 'Olsen, Erik',       timestamp: '2026-01-04T08:00:30' },
    { name: 'Petrini, Lou',      timestamp: '2026-01-04T08:00:42' },
    { name: 'Quinn, Brian',      timestamp: '2026-01-04T08:00:58' },
    { name: 'Russo, Anthony',    timestamp: '2026-01-04T08:01:14' },
    { name: 'Sciacca, Mike',     timestamp: '2026-01-04T08:01:33' },
    { name: 'Tedeschi, Paul',    timestamp: '2026-01-04T08:01:52' },
    { name: 'Underhill, Greg',   timestamp: '2026-01-04T08:02:14' },
    { name: 'Vasquez, Hector',   timestamp: '2026-01-04T08:02:41' },
    { name: 'Whalen, Dan',       timestamp: '2026-01-04T08:03:18' },
    { name: 'Xu, Kevin',         timestamp: '2026-01-04T08:04:01' },
    { name: 'Yannakakis, Nick',  timestamp: '2026-01-04T08:04:23' }
  ];

  // ---------- SEED DATA ----------
  function seedData() {
    const participants2025 = [
      'Amico, Angelo', 'Battista, Mike', 'Bella, David', 'Burke, Mike',
      'Campbell, Alan', 'Cancian, David', 'Casey, Peter', 'Chryssis, Alex',
      'Conroy, Jim', 'Copelotti, Andrew', 'Costello, Mike', 'Coughlin, John',
      'Cristofori, Mark', 'Deguglielmo, Paul', 'Doherty, Mark', 'Dolan, Ryan',
      'Douglas, James', 'Feldman, Doug', 'Foldenauer, Jeff', 'Gehrig, Joe Sr.',
      'Gentile, Chris', 'Glynn, Paul',
      'Halloran, Tim', 'Higgins, Bob', 'Hurley, Dave', 'Iorio, Sam',
      'Jacobs, Mike', 'Kelley, Joe', 'Kennedy, Tom', 'Lally, Brian',
      'Lawrence, Bill', 'Lentini, Vinny', 'MacDonald, Ross', 'Manzelli, Tony',
      'Marsh, Pete', 'McCormack, Sean', 'McGowan, Jim', 'Mello, Carlos',
      'Murphy, Bill', 'Nguyen, Tony', "O'Brien, Pat", "O'Connor, Mike",
      'Oliveira, Joao', 'Palermo, Sal', 'Pappas, Nick', 'Perrone, Joe',
      'Pham, Quang', 'Powers, Tim', 'Reilly, Brendan', 'Donovan, Bob',
      'Romano, Frank', 'Sabatino, Gus', 'Saint Pierre, Marc', 'Salvucci, Joe',
      'Santos, Marcus', 'Sheehan, Tim', 'Shimkus, Greg', 'Stein, Aaron',
      'Sullivan, Brian', 'Walsh, Jim'
    ];
    const took2025Off = [
      'Kilpatrick, Brian', 'Hagopian, Russ', 'Jones, Bryan', 'Boike, Joe',
      'Cole, Curtis', 'Costello, Robbie', 'Reynolds, Jim', 'Kim, Brian',
      'Garman, Shane', 'Arone, Dan', 'Hintlian, Ken', 'Bartley, Jack'
    ];
    const waitlist2025 = [
      'Gehrig, Joe Jr.', 'Johnson, Phil', 'Micalizzi, Dave',
      "O'Neill, Conor", 'Judge, Greg', 'Cohan, Nick'
    ];

    const players = [];
    let id = 1;
    const seedDate = '2024-12-01';
    participants2025.forEach(name => {
      players.push({
        id: 'p' + (id++), name: name, notes: '',
        seasons: { 2025: { list: 'participants' } },
        history: [{ date: seedDate, event: 'Played in 2025 season', type: 'add' }]
      });
    });
    took2025Off.forEach(name => {
      players.push({
        id: 'p' + (id++), name: name, notes: '',
        seasons: { 2025: { list: 'deferred' } },
        history: [
          { date: '2024-11-15', event: 'Participant in prior season', type: 'add' },
          { date: seedDate, event: 'Deferred for 2025 season', type: 'defer', season: 2025 }
        ]
      });
    });
    waitlist2025.forEach(name => {
      players.push({
        id: 'p' + (id++), name: name, notes: '',
        seasons: { 2025: { list: 'waitlist' } },
        history: [{ date: seedDate, event: 'On 2025 waitlist', type: 'add' }]
      });
    });

    const demoExtras = {
      'Amico, Angelo': {
        notes: 'Plays fast — prefers 7:30 tee time. Original tournament member.',
        history: [
          { date: '2019-11-01', event: 'Played in 2020 season', type: 'add' },
          { date: '2020-11-01', event: 'Played in 2021 season', type: 'add' },
          { date: '2021-11-01', event: 'Played in 2022 season', type: 'add' },
          { date: '2022-11-01', event: 'Played in 2023 season', type: 'add' },
          { date: '2023-11-01', event: 'Played in 2024 season', type: 'add' },
          { date: '2024-12-01', event: 'Played in 2025 season', type: 'add' }
        ]
      },
      'Battista, Mike': {
        notes: 'Usually pairs with Burke. 14 handicap, consistent.',
        history: [
          { date: '2021-11-01', event: 'Played in 2022 season', type: 'add' },
          { date: '2022-11-01', event: 'Played in 2023 season', type: 'add' },
          { date: '2023-11-01', event: 'Played in 2024 season', type: 'add' },
          { date: '2024-12-01', event: 'Played in 2025 season', type: 'add' }
        ]
      },
      'Burke, Mike': {
        notes: 'Prefers walking. Cart only in bad weather. Pair with Battista.',
        history: [
          { date: '2020-11-01', event: 'Played in 2021 season', type: 'add' },
          { date: '2021-11-01', event: 'Played in 2022 season', type: 'add' },
          { date: '2022-11-01', event: 'Played in 2023 season', type: 'add' },
          { date: '2023-11-01', event: 'Played in 2024 season', type: 'add' },
          { date: '2024-12-01', event: 'Played in 2025 season', type: 'add' }
        ]
      },
      'Chryssis, Alex': {
        notes: 'Promoted from Waitlist in Feb 2023. Strong player — consistent low gross.',
        history: [
          { date: '2021-11-15', event: 'Added to Waitlist for 2022 season', type: 'add' },
          { date: '2022-11-15', event: 'Carried on Waitlist for 2023 season', type: 'add' },
          { date: '2023-02-10', event: 'Moved from Waitlist → Participants', type: 'move' },
          { date: '2023-11-01', event: 'Played in 2024 season', type: 'add' },
          { date: '2024-12-01', event: 'Played in 2025 season', type: 'add' }
        ]
      },
      'Coughlin, John': {
        notes: 'Attorney — schedule around trial calendar. Prefers late March weekends.',
        history: [
          { date: '2022-11-01', event: 'Played in 2023 season', type: 'add' },
          { date: '2023-11-01', event: 'Played in 2024 season', type: 'add' },
          { date: '2024-12-01', event: 'Played in 2025 season', type: 'add' }
        ]
      },
      'Reynolds, Jim': {
        notes: 'Shoulder surgery in 2022, back trouble late 2024 — check on status before confirming 2026.',
        history: [
          { date: '2020-11-01', event: 'Played in 2021 season', type: 'add' },
          { date: '2021-11-01', event: 'Deferred for 2022 season', type: 'defer', season: 2022 },
          { date: '2022-11-01', event: 'Returned from 2022 deferral', type: 'return' },
          { date: '2023-11-01', event: 'Played in 2024 season', type: 'add' },
          { date: '2024-11-15', event: 'Played in 2024 season', type: 'add' },
          { date: '2024-12-01', event: 'Deferred for 2025 season', type: 'defer', season: 2025 }
        ]
      },
      'Kilpatrick, Brian': {
        history: [
          { date: '2021-11-01', event: 'Played in 2022 season', type: 'add' },
          { date: '2022-11-01', event: 'Played in 2023 season', type: 'add' },
          { date: '2023-11-01', event: 'Played in 2024 season', type: 'add' },
          { date: '2024-12-01', event: 'Deferred for 2025 season', type: 'defer', season: 2025 }
        ]
      },
      'Bartley, Jack': {
        notes: 'Work travel schedule variable. Confirm early for 2026.',
        history: [
          { date: '2022-11-01', event: 'Played in 2023 season', type: 'add' },
          { date: '2023-11-01', event: 'Played in 2024 season', type: 'add' },
          { date: '2024-12-01', event: 'Deferred for 2025 season', type: 'defer', season: 2025 }
        ]
      },
      'Judge, Greg': {
        notes: 'Priority for next open spot. Member since 2018. Confirmed 2026 interest via email 2/10.',
        history: [
          { date: '2022-11-15', event: 'Added to Waitlist for 2023 season', type: 'add' },
          { date: '2023-11-15', event: 'Carried on Waitlist for 2024 season', type: 'add' },
          { date: '2024-12-01', event: 'On 2025 waitlist', type: 'add' }
        ]
      },
      "O'Neill, Conor": {
        notes: "Son of past member John O'Neill (founding member, 1998). Sponsored by Paul Glynn.",
        history: [
          { date: '2023-11-15', event: 'Added to Waitlist for 2024 season', type: 'add' },
          { date: '2024-12-01', event: 'Carried on Waitlist for 2025 season', type: 'add' }
        ]
      },
      'Micalizzi, Dave': {
        notes: 'Referred by Jim Conroy. Eager for first year.'
      }
    };
    players.forEach(p => {
      const extra = demoExtras[p.name];
      if (!extra) return;
      if (extra.notes !== undefined) p.notes = extra.notes;
      if (extra.history) p.history = extra.history;
    });

    return {
      activeSeason: CURRENT_SEASON,
      players: players,
      columnOrder: DEFAULT_COLUMN_ORDER.slice()
    };
  }

  // ---------- STATE ----------
  let state = loadState();
  try { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  let currentView = 'internal';
  let searchQuery = '';
  const columnSearch = {};
  let dragging = null; // { playerId, cardEl }
  let columnDragging = null; // column id being dragged
  const importStagger = new Map(); // playerId -> stagger index for fade-in animation
  let staggerClearTimer = null;

  function scheduleStaggerClear(delayMs) {
    if (staggerClearTimer) clearTimeout(staggerClearTimer);
    staggerClearTimer = setTimeout(() => {
      importStagger.clear();
      staggerClearTimer = null;
    }, delayMs);
  }

  function sanitizeColumnOrder(order) {
    const known = new Set(DEFAULT_COLUMN_ORDER);
    const result = Array.isArray(order) ? order.filter(id => known.has(id)) : [];
    DEFAULT_COLUMN_ORDER.forEach(id => {
      if (!result.includes(id)) result.push(id);
    });
    return result;
  }

  function reorderColumn(fromId, toId, dropBefore) {
    if (fromId === toId) return;
    const order = state.columnOrder.slice();
    const fromIdx = order.indexOf(fromId);
    if (fromIdx < 0) return;
    order.splice(fromIdx, 1);
    let toIdx = order.indexOf(toId);
    if (toIdx < 0) return;
    if (!dropBefore) toIdx += 1;
    order.splice(toIdx, 0, fromId);
    state.columnOrder = order;
    saveState();
    render();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedData();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.players)) return seedData();
      if (typeof parsed.activeSeason !== 'number') parsed.activeSeason = CURRENT_SEASON;
      parsed.columnOrder = sanitizeColumnOrder(parsed.columnOrder);
      return parsed;
    } catch (e) {
      return seedData();
    }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function resetState() {
    if (!confirm('Reset all data to the 8/29/2025 seed? This will erase any changes.')) return;
    state = seedData();
    saveState();
    render();
  }

  // ---------- HELPERS ----------
  function today() { return new Date().toISOString().slice(0, 10); }

  function formatSignupTime(iso) {
    const t = iso.slice(11, 19);
    let [h, m, s] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ' ' + ampm;
  }
  function formatSignupOffset(iso) {
    const open = new Date(IMPORT_OPEN_ISO).getTime();
    const t = new Date(iso).getTime();
    const diff = Math.max(0, Math.floor((t - open) / 1000));
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return '+' + m + ':' + String(s).padStart(2, '0');
  }
  function formatSignupDate(iso) {
    const [y, mo, d] = iso.slice(0, 10).split('-').map(Number);
    return mo + '/' + d + '/' + y;
  }
  function logHistory(player, event, type, extra) {
    if (!player.history) player.history = [];
    const entry = { date: today(), event: event, type: type || 'move' };
    if (extra) Object.assign(entry, extra);
    player.history.push(entry);
  }

  function getSeason(player, year) {
    return player.seasons && player.seasons[year];
  }
  function setSeason(player, year, value) {
    if (!player.seasons) player.seasons = {};
    if (value === null) delete player.seasons[year];
    else player.seasons[year] = value;
  }
  function playersInListForSeason(year, listId) {
    return state.players.filter(p => {
      const s = getSeason(p, year);
      return s && s.list === listId;
    });
  }
  function getStatus(player, year) {
    const s = getSeason(player, year);
    if (!s || s.list !== 'participants') return null;
    if (year === CURRENT_SEASON) return s.status || 'confirmed';
    return 'played';
  }
  function previouslyDeferred(player) {
    const prior = getSeason(player, LAST_SEASON);
    return !!(prior && prior.list === 'deferred');
  }

  function participantCounts(year) {
    if (year === undefined) year = CURRENT_SEASON;
    let confirmed = 0, pending = 0;
    for (const p of state.players) {
      const s = getSeason(p, year);
      if (!s || s.list !== 'participants') continue;
      if (s.status === 'pending') pending++;
      else confirmed++;
    }
    return { confirmed, pending };
  }
  function rolloverCandidates(listId) {
    return state.players.filter(p => {
      const s = getSeason(p, LAST_SEASON);
      return s && s.list === listId && !getSeason(p, CURRENT_SEASON);
    });
  }

  // ---------- RENDER ----------
  const mainEl = document.getElementById('main-view');
  const bannerArea = document.getElementById('banner-area');
  const overlay = document.getElementById('modal-overlay');
  const switcherEl = document.getElementById('season-switcher');
  const slotMeterEl = document.getElementById('slot-meter');

  function render() {
    renderHeaderControls();
    renderSetupBanner();
    if (currentView === 'internal') renderInternal();
    else renderPublic();
  }

  const printViewEl = document.getElementById('print-view');
  function renderPrintView() {
    const year = state.activeSeason;
    const participants = playersInListForSeason(year, 'participants').slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    const waitlist = playersInListForSeason(year, 'waitlist');
    const { confirmed, pending } = participantCounts(year);

    const printedOn = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const rosterItems = participants.map(p => {
      const s = getSeason(p, year);
      const isPending = year === CURRENT_SEASON && s && s.status === 'pending';
      return '<li' + (isPending ? ' class="pending"' : '') + '>' +
        escapeHtml(p.name) +
        (isPending ? ' <span class="pending-tag">(pending)</span>' : '') +
        '</li>';
    }).join('');

    const waitlistItems = waitlist.map(p => '<li>' + escapeHtml(p.name) + '</li>').join('');

    const summaryParts = [
      '<span><strong>' + confirmed + '</strong> confirmed / ' + SLOT_CAP + ' slots</span>'
    ];
    if (pending > 0) summaryParts.push('<span>' + pending + ' pending</span>');
    summaryParts.push('<span>' + waitlist.length + ' on waitlist</span>');

    printViewEl.innerHTML =
      '<div class="print-header">' +
        '<h1>Fred Wright Tournament &mdash; ' + year + ' Roster</h1>' +
        '<div class="print-meta">Oakley Country Club &middot; Printed ' + escapeHtml(printedOn) + '</div>' +
      '</div>' +
      '<div class="print-summary">' + summaryParts.join('') + '</div>' +
      '<section class="print-section">' +
        '<h2>Participants</h2>' +
        (rosterItems
          ? '<ul class="print-roster">' + rosterItems + '</ul>'
          : '<p class="print-empty">No participants yet.</p>') +
      '</section>' +
      '<section class="print-section">' +
        '<h2>Waitlist</h2>' +
        (waitlistItems
          ? '<ol class="print-waitlist">' + waitlistItems + '</ol>'
          : '<p class="print-empty">No players on the waitlist.</p>') +
      '</section>';
  }

  function renderHeaderControls() {
    switcherEl.innerHTML = SEASONS.map(y =>
      '<button class="season-btn' + (state.activeSeason === y ? ' active' : '') + '" data-year="' + y + '">' + y + '</button>'
    ).join('');
    switcherEl.querySelectorAll('.season-btn').forEach(btn => {
      btn.onclick = () => {
        state.activeSeason = Number(btn.dataset.year);
        saveState();
        render();
      };
    });

    const showMeter = currentView === 'internal';
    slotMeterEl.style.visibility = showMeter ? 'visible' : 'hidden';
    const isCurrent = state.activeSeason === CURRENT_SEASON;
    const { confirmed, pending } = showMeter ? participantCounts(state.activeSeason) : { confirmed: 0, pending: 0 };
    const pct = Math.min(100, Math.round((confirmed / SLOT_CAP) * 100));
    // Archive seasons get a neutral 'archived' level (no over-cap warning red).
    let level = 'low';
    if (!isCurrent) level = 'archived';
    else if (confirmed >= SLOT_CAP) level = 'full';
    else if (confirmed >= SLOT_CAP * 0.8) level = 'high';
    updateSlotMeter(confirmed, pending, pct, level);
  }

  function updateSlotMeter(confirmed, pending, pct, level) {
    if (!slotMeterEl.firstChild) {
      slotMeterEl.innerHTML =
        '<div class="slot-meter-label">' +
          '<strong class="slot-confirmed"></strong> / ' + SLOT_CAP + ' confirmed' +
          ' <span class="slot-meter-pending"></span>' +
        '</div>' +
        '<div class="slot-meter-bar"><div class="slot-meter-fill"></div></div>';
    }
    slotMeterEl.querySelector('.slot-confirmed').textContent = confirmed;
    const pendingEl = slotMeterEl.querySelector('.slot-meter-pending');
    pendingEl.textContent = pending > 0 ? '+' + pending + ' pending' : '';
    const fill = slotMeterEl.querySelector('.slot-meter-fill');
    fill.className = 'slot-meter-fill ' + level;
    fill.style.width = pct + '%';
  }

  function renderSetupBanner() {
    bannerArea.innerHTML = '';
    if (state.activeSeason !== CURRENT_SEASON || currentView !== 'internal') return;

    let unrolled = 0;
    let anyRolled = false;
    for (const p of state.players) {
      const prior = getSeason(p, LAST_SEASON);
      const current = getSeason(p, CURRENT_SEASON);
      if (current) anyRolled = true;
      if (prior && ROLLOVER_SOURCES.has(prior.list) && !current) unrolled++;
    }
    if (unrolled === 0) return;

    const text = anyRolled
      ? '<strong>' + unrolled + ' player' + (unrolled === 1 ? '' : 's') + ' from ' + LAST_SEASON + '</strong> ' +
        'still available to roll over.'
      : '<strong>' + CURRENT_SEASON + ' season is empty.</strong> ' +
        'Roll over players from ' + LAST_SEASON + ' to start building the list.';

    const div = document.createElement('div');
    div.className = 'banner';
    div.innerHTML =
      '<div class="banner-icon">&#x27F2;</div>' +
      '<div class="banner-text">' + text + '</div>' +
      '<button id="banner-setup">' + (anyRolled ? 'Continue' : 'Set Up ' + CURRENT_SEASON + ' Season') + '</button>';
    bannerArea.appendChild(div);
    document.getElementById('banner-setup').onclick = showSetupDialog;
  }

  function renderInternal() {
    const isActive = state.activeSeason === CURRENT_SEASON;
    mainEl.innerHTML = '<div class="kanban" id="kanban"></div>';

    columnDragging = null;
    const kanban = document.getElementById('kanban');
    const year = state.activeSeason;
    state.columnOrder.forEach(listId => {
      const title = listDisplayName(listId, year);

      const col = document.createElement('div');
      col.className = 'column';
      col.dataset.listId = listId;
      col.dataset.colYear = year;
      col.dataset.columnId = listId;
      if (!isActive) col.classList.add('readonly');

      attachColumnReorderHandlers(col, listId);

      const header = document.createElement('div');
      header.className = 'column-header';
      const handleEl = document.createElement('span');
      handleEl.className = 'col-handle';
      handleEl.setAttribute('aria-hidden', 'true');
      handleEl.innerHTML = GRIP_SVG;
      header.appendChild(handleEl);
      header.draggable = true;
      header.addEventListener('dragstart', e => {
        if (e.target.closest('button, input')) {
          e.preventDefault();
          return;
        }
        columnDragging = listId;
        col.classList.add('col-dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', 'column:' + listId); } catch (err) {}
      });
      header.addEventListener('dragend', () => {
        columnDragging = null;
        document.querySelectorAll('.col-dragging, .col-drop-before, .col-drop-after')
          .forEach(el => el.classList.remove('col-dragging', 'col-drop-before', 'col-drop-after'));
      });
      const titleEl = document.createElement('div');
      titleEl.className = 'column-title';
      titleEl.textContent = title;
      const countEl = document.createElement('span');
      countEl.className = 'count-badge';
      const players = playersInListForSeason(year, listId);
      countEl.textContent = players.length;
      header.appendChild(titleEl);
      header.appendChild(countEl);
      const addBtn = document.createElement('button');
      addBtn.className = 'btn-add';
      addBtn.textContent = '+';
      addBtn.title = 'Add player';
      if (isActive) {
        addBtn.onclick = () => addPlayerToList(listId);
      } else {
        addBtn.style.visibility = 'hidden';
        addBtn.tabIndex = -1;
      }
      header.appendChild(addBtn);

      const searchWrap = document.createElement('div');
      searchWrap.className = 'column-search-wrap';
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'column-search';
      searchInput.placeholder = 'Search…';
      searchInput.value = columnSearch[listId] || '';
      searchInput.setAttribute('aria-label', 'Search ' + title);
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'column-search-clear';
      clearBtn.textContent = '×';
      clearBtn.title = 'Clear search';
      clearBtn.setAttribute('aria-label', 'Clear search');
      searchWrap.appendChild(searchInput);
      searchWrap.appendChild(clearBtn);

      const isNew = listId === 'new';
      const importedPlayers = isNew && isActive ? players.filter(p => p.signupTimestamp) : [];
      let statusEl = null;
      if (isNew && isActive && importedPlayers.length > 0) {
        const tsList = importedPlayers.map(p => p.signupTimestamp).slice().sort();
        const first = tsList[0];
        const last = tsList[tsList.length - 1];
        statusEl = document.createElement('div');
        statusEl.className = 'import-status';
        statusEl.innerHTML =
          '<div class="import-status-text">' +
            '<strong>Imported &middot; ' + escapeHtml(formatSignupDate(first)) + '</strong> &middot; ' +
            escapeHtml(formatSignupTime(first)) + '&ndash;' + escapeHtml(formatSignupTime(last)) +
          '</div>' +
          '<button class="btn-clear-import">Clear</button>';
      }

      const cardsEl = document.createElement('div');
      cardsEl.className = 'cards';
      cardsEl.dataset.listId = listId;
      cardsEl.dataset.colYear = year;
      if (isNew && isActive && players.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-import';
        empty.innerHTML =
          '<div class="empty-import-text">No new signups yet</div>' +
          '<button class="btn-import">Import from Golf Genius</button>';
        cardsEl.appendChild(empty);
      } else {
        players.forEach((p, i) => cardsEl.appendChild(renderCard(p, i + 1)));
      }
      if (isActive) attachDropHandlers(cardsEl);

      const applyColumnFilter = () => {
        const q = searchInput.value.toLowerCase().trim();
        const cards = cardsEl.querySelectorAll('.card');
        let visible = 0;
        cards.forEach(card => {
          const name = card.querySelector('.card-name').textContent.toLowerCase();
          const match = !q || name.includes(q);
          card.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        countEl.textContent = q ? visible + ' / ' + players.length : players.length;
        const existingEmpty = cardsEl.querySelector('.search-empty');
        if (existingEmpty) existingEmpty.remove();
        if (q && visible === 0) {
          const msg = document.createElement('div');
          msg.className = 'search-empty';
          msg.textContent = 'No matches';
          cardsEl.appendChild(msg);
        }
        clearBtn.classList.toggle('visible', q.length > 0);
      };
      const setSearch = (val) => {
        searchInput.value = val;
        columnSearch[listId] = val;
        applyColumnFilter();
      };
      searchInput.addEventListener('input', () => {
        columnSearch[listId] = searchInput.value;
        applyColumnFilter();
      });
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape' && searchInput.value) setSearch('');
      });
      clearBtn.onclick = () => {
        setSearch('');
        searchInput.focus();
      };

      col.appendChild(header);
      if (statusEl) col.appendChild(statusEl);
      col.appendChild(searchWrap);
      col.appendChild(cardsEl);
      kanban.appendChild(col);

      if (isNew && isActive) {
        const importBtn = cardsEl.querySelector('.btn-import');
        if (importBtn) importBtn.onclick = showImportConfirm;
        if (statusEl) {
          statusEl.querySelector('.btn-clear-import').onclick = clearImportedPlayers;
        }
      }

      if (searchInput.value) applyColumnFilter();
    });
  }

  function renderCard(p, position) {
    const year = state.activeSeason;
    const seasonInfo = getSeason(p, year);
    const listId = seasonInfo ? seasonInfo.list : null;
    const editable = year === CURRENT_SEASON;

    const div = document.createElement('div');
    div.className = 'card';
    div.draggable = editable;
    div.dataset.playerId = p.id;

    const handleEl = document.createElement('span');
    handleEl.className = 'card-handle';
    handleEl.innerHTML = GRIP_SVG;
    div.appendChild(handleEl);

    const posEl = document.createElement('span');
    posEl.className = 'card-position';
    posEl.textContent = position + '.';
    div.appendChild(posEl);

    const nameEl = document.createElement('span');
    nameEl.className = 'card-name';
    nameEl.textContent = p.name;
    div.appendChild(nameEl);

    if (listId === 'participants' && year === CURRENT_SEASON) {
      const status = getStatus(p, year);
      const badge = document.createElement('span');
      badge.className = 'badge badge-' + status;
      badge.textContent = status === 'confirmed' ? 'Confirmed' : 'Pending';
      div.appendChild(badge);
    } else if (listId === 'deferred') {
      const badge = document.createElement('span');
      badge.className = 'badge badge-deferred';
      badge.textContent = 'Deferred in ' + year;
      div.appendChild(badge);
    } else if (listId === 'new' && !p.signupTimestamp) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-new';
      badge.textContent = 'New';
      div.appendChild(badge);
    }

    const deferSeasons = getDeferSeasons(p);
    const mostRecentDefer = deferSeasons.length ? Math.max.apply(null, deferSeasons) : null;
    const suppressYear = listId === 'deferred' ? year : null;
    if (mostRecentDefer !== null && mostRecentDefer !== suppressYear) {
      const tag = document.createElement('span');
      tag.className = 'defer-tag';
      tag.textContent = 'Deferred in ' + mostRecentDefer;
      tag.title = 'Most recent deferral: ' + mostRecentDefer + ' (see history for prior deferrals)';
      div.appendChild(tag);
    }

    if (listId === 'new' && p.signupTimestamp) {
      const tsEl = document.createElement('span');
      tsEl.className = 'card-timestamp';
      tsEl.innerHTML =
        '<span class="ts-time">' + escapeHtml(formatSignupTime(p.signupTimestamp)) + '</span>' +
        '<span class="ts-offset">' + escapeHtml(formatSignupOffset(p.signupTimestamp)) + '</span>';
      tsEl.title = 'Signed up via Golf Genius at ' + formatSignupTime(p.signupTimestamp) + ' on ' + formatSignupDate(p.signupTimestamp);
      div.appendChild(tsEl);
    }

    if (importStagger.has(p.id)) {
      div.classList.add('signup-stagger');
      div.style.setProperty('--stagger-idx', importStagger.get(p.id));
    }

    let dragStarted = false;
    if (editable) {
      div.addEventListener('dragstart', e => {
        dragStarted = true;
        dragging = { playerId: p.id, cardEl: div };
        div.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', p.id); } catch (err) {}
      });
      div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
        dragging = null;
        document.querySelectorAll('.cards.drop-target').forEach(el => el.classList.remove('drop-target'));
      });
    }
    div.addEventListener('click', () => {
      if (dragStarted) { dragStarted = false; return; }
      showPlayerModal(p.id);
    });

    return div;
  }

  function attachColumnReorderHandlers(col, columnId) {
    col.addEventListener('dragover', e => {
      if (!columnDragging || columnDragging === columnId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const box = col.getBoundingClientRect();
      const dropBefore = e.clientX < box.left + box.width / 2;
      col.classList.toggle('col-drop-before', dropBefore);
      col.classList.toggle('col-drop-after', !dropBefore);
    });
    col.addEventListener('dragleave', e => {
      if (!col.contains(e.relatedTarget)) {
        col.classList.remove('col-drop-before', 'col-drop-after');
      }
    });
    col.addEventListener('drop', e => {
      if (!columnDragging || columnDragging === columnId) return;
      e.preventDefault();
      const box = col.getBoundingClientRect();
      const dropBefore = e.clientX < box.left + box.width / 2;
      col.classList.remove('col-drop-before', 'col-drop-after');
      reorderColumn(columnDragging, columnId, dropBefore);
    });
  }

  function attachDropHandlers(cardsEl) {
    cardsEl.addEventListener('dragover', e => {
      if (columnDragging) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      cardsEl.classList.add('drop-target');
    });
    cardsEl.addEventListener('dragleave', e => {
      if (e.target === cardsEl) cardsEl.classList.remove('drop-target');
    });
    cardsEl.addEventListener('drop', e => {
      if (columnDragging) return;
      e.preventDefault();
      cardsEl.classList.remove('drop-target');
      if (!dragging) return;
      const player = state.players.find(p => p.id === dragging.playerId);
      if (!player) return;
      const toListId = cardsEl.dataset.listId;
      const afterEl = getDropTarget(cardsEl, e.clientY);
      const afterPlayerId = afterEl ? afterEl.dataset.playerId : null;
      attemptMove(player, toListId, afterPlayerId);
    });
  }

  function getDropTarget(container, y) {
    const cards = Array.from(container.querySelectorAll('.card')).filter(c => !c.classList.contains('dragging'));
    let closest = { offset: Number.NEGATIVE_INFINITY, card: null };
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const box = card.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        closest = { offset: offset, card: card };
      }
    }
    return closest.card;
  }

  function guardDefer(player, onDefer, onWaitlist) {
    if (previouslyDeferred(player)) {
      showDeferralWarning(player, onWaitlist, onDefer);
    } else {
      onDefer();
    }
  }

  function attemptMove(player, toListId, afterPlayerId) {
    if (toListId === 'deferred') {
      guardDefer(player,
        () => applyMove(player, 'deferred', afterPlayerId),
        () => applyMove(player, 'waitlist', null)
      );
      return;
    }
    applyMove(player, toListId, afterPlayerId);
  }

  function showDeferralWarning(player, onWaitlist, onDeferAnyway) {
    showConfirmDialog({
      title: 'Second Consecutive Deferral',
      bodyHtml:
        '<p><strong>' + escapeHtml(player.name) + '</strong> already deferred for the ' + LAST_SEASON + ' season. ' +
        'Per tournament rules, a second consecutive deferral should send them to the <strong>bottom of the ' + CURRENT_SEASON + ' Waitlist</strong>.</p>' +
        '<p style="margin-top:8px;">You can override this if needed.</p>',
      buttons: [
        { label: 'Cancel' },
        { label: 'Defer Anyway (override)', className: 'warn', onClick: () => { closeModal(); onDeferAnyway(); } },
        { label: 'Move to Waitlist', className: 'primary', onClick: () => { closeModal(); onWaitlist(); } }
      ]
    });
  }

  function applyMove(player, toListId, afterPlayerId) {
    const year = state.activeSeason;
    const fromListId = (getSeason(player, year) || {}).list;
    const curIdx = state.players.findIndex(p => p.id === player.id);
    if (curIdx >= 0) state.players.splice(curIdx, 1);

    const newSeasonInfo = { list: toListId };
    if (toListId === 'participants') newSeasonInfo.status = 'pending';
    setSeason(player, year, newSeasonInfo);

    if (afterPlayerId) {
      const afterIdx = state.players.findIndex(p => p.id === afterPlayerId);
      if (afterIdx >= 0) state.players.splice(afterIdx, 0, player);
      else state.players.push(player);
    } else {
      state.players.push(player);
    }

    if (fromListId !== toListId) {
      let moveType = 'move';
      let extra;
      if (toListId === 'deferred') { moveType = 'defer'; extra = { season: year }; }
      else if (fromListId === 'deferred') moveType = 'return';
      const fromDisplay = fromListId ? listDisplayName(fromListId, year) : 'Not in ' + year;
      logHistory(player, 'Moved from ' + fromDisplay + ' → ' + listDisplayName(toListId, year), moveType, extra);
    } else {
      logHistory(player, 'Reordered within ' + listDisplayName(toListId, year), 'reorder');
    }

    saveState();
    render();
  }

  // ---------- MODAL ----------
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  function closeModal() {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }

  function showConfirmDialog({ title, bodyHtml, buttons, extraClass }) {
    const c = document.createElement('div');
    c.className = 'confirm' + (extraClass ? ' ' + extraClass : '');
    c.innerHTML =
      '<h2>' + title + '</h2>' +
      bodyHtml +
      '<div class="confirm-actions">' +
        buttons.map((b, i) =>
          '<button data-idx="' + i + '"' + (b.className ? ' class="' + b.className + '"' : '') + '>' + b.label + '</button>'
        ).join('') +
      '</div>';
    overlay.innerHTML = '';
    overlay.appendChild(c);
    overlay.classList.remove('hidden');
    buttons.forEach((b, i) => {
      c.querySelector('[data-idx="' + i + '"]').onclick = b.onClick
        ? () => b.onClick(c)
        : closeModal;
    });
  }

  function showPlayerModal(playerId) {
    const p = state.players.find(x => x.id === playerId);
    if (!p) return;
    const year = state.activeSeason;
    const isActive = year === CURRENT_SEASON;
    const seasonInfo = getSeason(p, year);
    const currentListId = seasonInfo ? seasonInfo.list : null;
    const status = isActive ? getStatus(p, year) : null;

    const initialHistory = p.history || [];
    const firstYear = initialHistory.length ? initialHistory[0].date.slice(0, 4) : '—';
    const deferSeasons = getDeferSeasons(p);
    const deferSeasonsStr = deferSeasons.length ? deferSeasons.join(', ') : '—';

    const currentListName = currentListId ? listDisplayName(currentListId, year) : 'Not in ' + year;

    const otherListIds = LIST_IDS.filter(id => id !== currentListId);

    const modal = document.createElement('div');
    modal.className = 'modal';

    let actionsHtml = '';
    if (isActive && currentListId === 'participants' && status === 'pending') {
      actionsHtml =
        '<button class="primary" data-action="confirm">&check; Confirm for ' + year + '</button>' +
        '<button class="warn" data-action="decline">&times; Decline (defer to ' + (year + 1) + ')</button>';
    } else if (isActive && currentListId === 'participants' && status === 'confirmed') {
      actionsHtml =
        '<button data-action="unconfirm">Mark Pending</button>' +
        '<button class="warn" data-action="decline">Decline (defer to ' + (year + 1) + ')</button>';
    }

    const moveButtons = isActive
      ? otherListIds.map(id => '<button data-move="' + id + '">Move to ' + escapeHtml(listDisplayName(id, year)) + '</button>').join('')
      : '';

    modal.innerHTML =
      '<div class="modal-header">' +
        '<h2>' + escapeHtml(p.name) + '</h2>' +
        '<button class="close" id="m-close">&times;</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="stats-grid">' +
          '<div class="stat-item"><span class="stat-label">' + year + ' status</span><span class="stat-value">' + escapeHtml(currentListName) + (status ? ' (' + status + ')' : '') + '</span></div>' +
          '<div class="stat-item"><span class="stat-label">In system since</span><span class="stat-value">' + firstYear + '</span></div>' +
          '<div class="stat-item"><span class="stat-label">Times deferred</span><span class="stat-value">' + deferSeasons.length + '</span></div>' +
          '<div class="stat-item"><span class="stat-label">Deferred seasons</span><span class="stat-value">' + deferSeasonsStr + '</span></div>' +
        '</div>' +
        (actionsHtml ? '<div class="action-row">' + actionsHtml + '</div>' : '') +
        '<div class="notes-section">' +
          '<h3>Notes</h3>' +
          '<textarea class="notes-textarea" id="notes-textarea" placeholder="Back trouble — morning tee times only. Usually pairs with Mike Burke. Emailed 3/15, no reply yet."></textarea>' +
          '<button class="notes-save-btn" id="notes-save" disabled>Save notes</button>' +
        '</div>' +
        '<div class="history">' +
          '<h3>History</h3>' +
          '<div class="history-filters">' +
            '<button class="filter-chip active" data-filter="all">All</button>' +
            '<button class="filter-chip" data-filter="moves">Moves</button>' +
            '<button class="filter-chip" data-filter="deferrals">Deferrals</button>' +
            '<button class="filter-chip" data-filter="notes">Notes</button>' +
          '</div>' +
          '<div id="history-list"></div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-footer">' +
        moveButtons +
        '<div style="flex:1"></div>' +
        (isActive ? '<button class="danger" id="m-delete">Delete</button>' : '') +
      '</div>';

    overlay.innerHTML = '';
    overlay.appendChild(modal);
    overlay.classList.remove('hidden');

    const categoryForType = {
      move: 'moves', reorder: 'moves', add: 'moves',
      defer: 'deferrals', return: 'deferrals',
      confirm: 'moves', decline: 'deferrals',
      note: 'notes'
    };
    const chips = modal.querySelectorAll('.filter-chip');
    const historyContainer = modal.querySelector('#history-list');
    let activeFilter = 'all';
    const renderHistoryList = (filter) => {
      const hist = p.history || [];
      const filtered = filter === 'all'
        ? hist
        : hist.filter(h => categoryForType[h.type || 'move'] === filter);
      const reversed = filtered.slice().reverse();
      historyContainer.innerHTML = reversed.length === 0
        ? '<div class="empty-state">No entries in this category.</div>'
        : reversed.map(h =>
            '<div class="history-entry">' +
              '<span class="h-date">' + escapeHtml(h.date) + '</span>' +
              '<span class="h-event">' + escapeHtml(h.event) + '</span>' +
            '</div>').join('');
    };
    chips.forEach(chip => {
      chip.onclick = () => {
        chips.forEach(c => c.classList.toggle('active', c === chip));
        activeFilter = chip.dataset.filter;
        renderHistoryList(activeFilter);
      };
    });
    renderHistoryList(activeFilter);

    const notesArea = modal.querySelector('#notes-textarea');
    const notesBtn = modal.querySelector('#notes-save');
    let initialNotes = p.notes || '';
    notesArea.value = initialNotes;
    notesArea.addEventListener('input', () => {
      notesBtn.disabled = notesArea.value === initialNotes;
    });
    notesBtn.onclick = () => {
      const newValue = notesArea.value;
      if (newValue === initialNotes) return;
      p.notes = newValue;
      logHistory(p, newValue.trim() ? 'Notes updated' : 'Notes cleared', 'note');
      saveState();
      initialNotes = newValue;
      notesBtn.disabled = true;
      renderHistoryList(activeFilter);
    };

    modal.querySelector('#m-close').onclick = closeModal;
    const deleteBtn = modal.querySelector('#m-delete');
    if (deleteBtn) deleteBtn.onclick = () => {
      if (!confirm('Delete ' + p.name + ' from the tournament entirely?')) return;
      state.players = state.players.filter(x => x.id !== p.id);
      saveState();
      closeModal();
      render();
    };
    modal.querySelectorAll('[data-move]').forEach(btn => {
      btn.onclick = () => {
        closeModal();
        attemptMove(p, btn.dataset.move, null);
      };
    });
    modal.querySelectorAll('[data-action]').forEach(btn => {
      btn.onclick = () => {
        const action = btn.dataset.action;
        if (action === 'decline') {
          closeModal();
          guardDefer(p,
            () => {
              setSeason(p, year, { list: 'deferred' });
              logHistory(p, 'Declined ' + year + ' — deferred (eligible to return ' + (year + 1) + ')', 'decline', { season: year });
              saveState();
              render();
            },
            () => applyMove(p, 'waitlist', null)
          );
          return;
        }
        if (action === 'confirm') {
          setSeason(p, year, { list: 'participants', status: 'confirmed' });
          logHistory(p, 'Confirmed for ' + year + ' season', 'confirm');
        } else if (action === 'unconfirm') {
          setSeason(p, year, { list: 'participants', status: 'pending' });
          logHistory(p, 'Marked Pending for ' + year + ' season', 'move');
        }
        saveState();
        closeModal();
        render();
      };
    });
  }

  function showImportConfirm() {
    const first = IMPORT_PAYLOAD[0].timestamp;
    const last = IMPORT_PAYLOAD[IMPORT_PAYLOAD.length - 1].timestamp;
    showConfirmDialog({
      title: 'Import from Golf Genius',
      bodyHtml:
        '<p>Import <strong>' + IMPORT_PAYLOAD.length + ' new signups</strong> from Golf Genius ' +
        '(' + escapeHtml(formatSignupDate(first)) + ', ' +
        escapeHtml(formatSignupTime(first)) + '&ndash;' + escapeHtml(formatSignupTime(last)) + ')?</p>',
      buttons: [
        { label: 'Cancel' },
        { label: 'Import', className: 'primary', onClick: () => { closeModal(); performImport(); } }
      ]
    });
  }

  function performImport() {
    const baseId = Date.now();
    IMPORT_PAYLOAD.forEach((entry, idx) => {
      const player = {
        id: 'p' + (baseId + idx),
        name: entry.name,
        notes: '',
        signupTimestamp: entry.timestamp,
        seasons: { [CURRENT_SEASON]: { list: 'new' } },
        history: [{
          date: entry.timestamp.slice(0, 10),
          event: 'Signed up via Golf Genius at ' + formatSignupTime(entry.timestamp) + ' on ' + formatSignupDate(entry.timestamp),
          type: 'add'
        }]
      };
      state.players.push(player);
      importStagger.set(player.id, idx);
    });
    saveState();
    render();
    scheduleStaggerClear(IMPORT_PAYLOAD.length * 80 + 320);
  }

  function clearImportedPlayers() {
    const imported = state.players.filter(p => {
      const s = getSeason(p, CURRENT_SEASON);
      return s && s.list === 'new' && p.signupTimestamp;
    });
    if (imported.length === 0) return;
    if (!confirm('Clear ' + imported.length + ' imported signup' + (imported.length === 1 ? '' : 's') + ' from New Signups?')) return;
    state.players = state.players.filter(p => {
      const s = getSeason(p, CURRENT_SEASON);
      return !(s && s.list === 'new' && p.signupTimestamp);
    });
    saveState();
    render();
  }

  const ROLLOVER_SOURCES = new Set(['participants', 'deferred', 'waitlist']);
  const ROLLOVER_GROUPS = [
    {
      id: 'carryovers', sourceList: 'participants', targetList: 'participants', defaultChecked: true,
      label: 'active ' + LAST_SEASON + ' participants &rarr; ' + CURRENT_SEASON + ' Pending',
      historyFn: () => 'Rolled over from ' + LAST_SEASON + ' Participants → ' + CURRENT_SEASON + ' Pending',
      historyType: 'move'
    },
    {
      id: 'deferrals', sourceList: 'deferred', targetList: 'participants', defaultChecked: true,
      label: 'returning ' + LAST_SEASON + ' deferrals &rarr; ' + CURRENT_SEASON + ' Pending',
      historyFn: () => 'Returning from ' + LAST_SEASON + ' deferral → ' + CURRENT_SEASON + ' Pending',
      historyType: 'return'
    },
    {
      id: 'waitlist', sourceList: 'waitlist', targetList: 'waitlist', defaultChecked: false,
      label: LAST_SEASON + ' waitlist holdovers &rarr; Waitlist',
      historyFn: () => 'Carried on Waitlist for ' + CURRENT_SEASON + ' season',
      historyType: 'move'
    }
  ];

  function showSetupDialog() {
    const groups = ROLLOVER_GROUPS.map(g => ({ ...g, players: rolloverCandidates(g.sourceList) }));
    const optionsHtml = groups.map(g => {
      const empty = g.players.length === 0;
      const checked = !empty && g.defaultChecked;
      return '<label class="setup-option' + (empty ? ' disabled' : '') + '">' +
        '<input type="checkbox" data-group="' + g.id + '"' + (checked ? ' checked' : '') + (empty ? ' disabled' : '') + '>' +
        '<span class="setup-count">' + g.players.length + '</span>' +
        '<span class="setup-label">' + g.label + '</span>' +
      '</label>';
    }).join('');

    showConfirmDialog({
      title: 'Set Up ' + CURRENT_SEASON + ' Season',
      extraClass: 'setup-dialog',
      bodyHtml:
        '<p>Carry players forward from ' + LAST_SEASON + '. They\'ll land in ' + CURRENT_SEASON + ' Participants as <strong>Pending</strong> until you confirm each one.</p>' +
        '<div class="setup-options">' + optionsHtml + '</div>' +
        '<div class="setup-summary" id="setup-summary"></div>',
      buttons: [
        { label: 'Cancel' },
        { label: 'Roll Over', className: 'primary', onClick: (c) => {
          const selected = groups.filter(g => c.querySelector('input[data-group="' + g.id + '"]').checked);
          if (selected.length === 0) return;
          closeModal();
          performRollover(selected);
        }}
      ]
    });

    const modal = overlay.querySelector('.setup-dialog');
    if (!modal) return;
    const summaryEl = modal.querySelector('#setup-summary');
    const rolloverBtn = modal.querySelector('[data-idx="1"]');
    const checkboxes = modal.querySelectorAll('input[type="checkbox"][data-group]');

    const updateSummary = () => {
      let pendingCount = 0, waitlistCount = 0, totalCount = 0;
      groups.forEach(g => {
        const cb = modal.querySelector('input[data-group="' + g.id + '"]');
        if (!cb || !cb.checked) return;
        totalCount += g.players.length;
        if (g.targetList === 'participants') pendingCount += g.players.length;
        else if (g.targetList === 'waitlist') waitlistCount += g.players.length;
      });

      if (totalCount === 0) {
        summaryEl.innerHTML = '<div class="setup-summary-empty">Nothing selected.</div>';
      } else {
        const overCap = pendingCount > SLOT_CAP;
        const overBy = pendingCount - SLOT_CAP;
        let html = '';
        html +=
          '<div class="setup-summary-row">' +
            '<span class="label">Pending after roll-over</span>' +
            '<span class="value' + (overCap ? ' over' : '') + '">' +
              pendingCount + ' / ' + SLOT_CAP +
            '</span>' +
          '</div>';
        if (overCap) {
          html +=
            '<div class="setup-summary-warn">' +
              'Exceeds cap by ' + overBy + ' — you\'ll trim ' + overBy + ' pending down before confirming.' +
            '</div>';
        }
        if (waitlistCount > 0) {
          html +=
            '<div class="setup-summary-row">' +
              '<span class="label">Added to Waitlist</span>' +
              '<span class="value">' + waitlistCount + '</span>' +
            '</div>';
        }
        summaryEl.innerHTML = html;
      }

      if (rolloverBtn) {
        if (totalCount === 0) {
          rolloverBtn.textContent = 'Roll Over';
          rolloverBtn.disabled = true;
        } else {
          rolloverBtn.textContent = 'Roll Over ' + totalCount + ' Player' + (totalCount === 1 ? '' : 's');
          rolloverBtn.disabled = false;
        }
      }
    };

    checkboxes.forEach(cb => cb.addEventListener('change', updateSummary));
    updateSummary();
  }

  function performRollover(selectedGroups) {
    const all = [];
    selectedGroups.forEach(group => {
      group.players.forEach(p => {
        const newSeason = { list: group.targetList };
        if (group.targetList === 'participants') newSeason.status = 'pending';
        setSeason(p, CURRENT_SEASON, newSeason);
        logHistory(p, group.historyFn(), group.historyType);
        all.push(p);
      });
    });

    all.forEach((p, idx) => importStagger.set(p.id, idx));
    saveState();
    render();
    scheduleStaggerClear(all.length * 60 + 320);
  }

  function addPlayerToList(listId) {
    const name = prompt('Player name (format: Last, First)');
    if (!name || !name.trim()) return;
    const year = state.activeSeason;
    const seasonInfo = { list: listId };
    if (listId === 'participants') seasonInfo.status = 'pending';
    const newPlayer = {
      id: 'p' + Date.now(),
      name: name.trim(),
      notes: '',
      seasons: { [year]: seasonInfo },
      history: [{ date: today(), event: 'Added to ' + listDisplayName(listId, year), type: 'add' }]
    };
    state.players.push(newPlayer);
    saveState();
    render();
  }

  // ---------- PUBLIC VIEW ----------
  function renderPublic() {
    const year = state.activeSeason;
    const isActive = year === CURRENT_SEASON;
    const inList = state.players
      .filter(p => {
        const s = getSeason(p, year);
        if (!s || s.list !== 'participants') return false;
        if (!isActive) return true;
        return (s.status || 'confirmed') === 'confirmed';
      })
      .map(p => p.name)
      .sort((a, b) => a.localeCompare(b));
    const waitingList = state.players
      .filter(p => {
        const s = getSeason(p, year);
        if (!s) return false;
        if (s.list !== 'participants') return true;
        return isActive && s.status === 'pending';
      })
      .map(p => p.name)
      .sort((a, b) => a.localeCompare(b));

    const renderRows = (list) => {
      if (list.length === 0) return '<div class="empty-state">No one here.</div>';
      let prevLetter = '';
      return list.map(n => {
        const letter = n.charAt(0).toUpperCase();
        const showLetter = letter !== prevLetter;
        prevLetter = letter;
        return '<div class="player-row' + (highlight(n) ? ' highlighted' : '') + '">' +
          '<span class="player-letter">' + (showLetter ? letter : '') + '</span>' +
          '<span class="player-name">' + escapeHtml(n) + '</span>' +
          '</div>';
      }).join('');
    };

    const renderColumn = (title, names) =>
      '<div class="public-column">' +
        '<h2>' + title + ' <span class="public-count">' + names.length + ' players &middot; alphabetical</span></h2>' +
        '<div class="public-list">' + renderRows(names) + '</div>' +
      '</div>';

    mainEl.innerHTML =
      '<div class="player-view">' +
        '<input type="text" class="search-box" id="search" placeholder="Search for your name..." value="' + escapeHtml(searchQuery) + '" />' +
        '<div class="public-grid">' +
          renderColumn('In the Tournament', inList) +
          renderColumn('Waiting', waitingList) +
        '</div>' +
        '<div class="rules-note">Names are listed <strong>alphabetically by last name</strong>. ' +
        'Placement in the Waiting list does <strong>not</strong> reflect position in the queue or priority for entry.</div>' +
      '</div>';

    const searchEl = document.getElementById('search');
    searchEl.addEventListener('input', e => {
      searchQuery = e.target.value;
      const cursor = searchEl.selectionStart;
      renderPublic();
      const newSearch = document.getElementById('search');
      newSearch.focus();
      newSearch.setSelectionRange(cursor, cursor);
    });
  }
  function highlight(name) {
    if (!searchQuery.trim()) return false;
    return name.toLowerCase().indexOf(searchQuery.toLowerCase().trim()) !== -1;
  }

  // ---------- UTILS ----------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---------- WIRE UP ----------
  document.querySelectorAll('.view-toggle button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.view-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      render();
    };
  });
  document.getElementById('btn-reset').onclick = resetState;
  document.getElementById('btn-print').onclick = () => {
    renderPrintView();
    window.print();
  };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeModal();
  });

  // Expose a small surface so design layers (back-office, the-program) can
  // reuse canonical state-shape helpers instead of re-deriving them.
  window.FW = {
    STORAGE_KEY,
    CURRENT_SEASON,
    LAST_SEASON,
    SLOT_CAP,
    LIST_IDS,
    listDisplayName,
    escapeHtml,
    getSeason,
    getStatus,
    previouslyDeferred,
    participantCounts,
    playersInListForSeason,
    getDeferSeasons,
    showPlayerModal,
    getState: () => state,
    HISTORY_CATEGORIES: {
      move: 'moves', reorder: 'moves', add: 'moves', confirm: 'moves',
      defer: 'deferrals', return: 'deferrals', decline: 'deferrals',
      note: 'notes'
    }
  };

  render();
})();
