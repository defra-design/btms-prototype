// app/routes/mvp/v4/reporting.js
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const moment = require('moment');

module.exports = (router) => {
  console.log('[routes] reporting.js loaded');

  // ----------------- config -----------------
  const DATA_DIR = 'app/data';
  const FILE_NO_MATCHES_LARGE = 'no-matches-basic-large.json'; // primary seed for ports + stats
  const FILE_NO_MATCHES_SMALL = 'no-matches-basic.json';       // used by the simple table route
  const FILE_MANUAL          = 'manual-release.json';          // optional seed; handled if missing

  // ----------------- date helpers -----------------
  const GOV_DATE_FORMATS = [
    'D MMMM YYYY, HH:mm',        // e.g. 29 August 2025, 10:59
    'D MMMM YYYY [at] h:mma',    // e.g. 29 August 2025 at 10:59am
    moment.ISO_8601
  ];
  const formatGovDate = m => m.format('D MMMM YYYY, HH:mm');
  const parseGovDate  = s => moment(s, GOV_DATE_FORMATS, true);

  function toMomentFromDDMMYYYY(s) {
    if (!s) return null;
    const [dd, mm, yyyy] = String(s).split('/');
    if (!dd || !mm || !yyyy) return null;
    return moment(`${yyyy}-${mm}-${dd}`, 'YYYY-MM-DD', true);
  }

  function getDateRangeFromSession(req, fallback = null) {
    const sd  = req.session?.data?.startDate;               // DD/MM/YYYY
    const ed  = req.session?.data?.endDate;
    const sth = req.session?.data?.startTime?.hour   || '00';
    const stm = req.session?.data?.startTime?.minute || '00';
    const enh = req.session?.data?.endTime?.hour     || '23';
    const enm = req.session?.data?.endTime?.minute   || '59';

    let usedSession = false;
    let start, end;

    if (sd && ed) {
      const s = moment(`${sd} ${sth}:${stm}`, 'DD/MM/YYYY HH:mm', true);
      const e = moment(`${ed} ${enh}:${enm}`, 'DD/MM/YYYY HH:mm', true);
      if (s.isValid()) { start = s; usedSession = true; }
      if (e.isValid()) { end   = e; usedSession = true; }
    }

    if (!usedSession) {
      const fb = fallback || {
        start: moment().subtract(1, 'month'),
        end:   moment(),
        label: 'last month'
      };
      start = fb.start.clone ? fb.start.clone() : fb.start;
      end   = fb.end.clone   ? fb.end.clone()   : fb.end;
      return { start, end, usedSession, fallbackLabel: fb.label || 'last month' };
    }

    return { start, end, usedSession, fallbackLabel: 'last month' };
  }

  function formatRangeLabel(start, end, usedSession, fallbackLabel = 'last month') {
    const left  = start.format('D MMMM YYYY [at] HH:mm');
    const right = end.format('D MMMM YYYY [at] HH:mm');
    return usedSession ? `${left} to ${right}` : `${fallbackLabel} (${left} to ${right})`;
  }

  // ----------------- data helpers -----------------
  function readJsonSafe(relPath, fallback = []) {
    try {
      const file = path.join(process.cwd(), relPath);
      return JSON.parse(fs.readFileSync(file, 'utf8')) || fallback;
    } catch (e) {
      console.error('[readJsonSafe]', relPath, e.message);
      return fallback;
    }
  }

  function getUniquePorts() {
    const rows = readJsonSafe(path.join(DATA_DIR, FILE_NO_MATCHES_LARGE));
    const ports = rows.map(r => r.portOfEntry).filter(Boolean);
    return _.sortBy(_.uniq(ports));
  }

  function cleanSelectedPorts(req) {
    return (req.session?.data?.selectedPorts || []).filter(v => v && v !== '_unchecked');
  }

  // Shift a dataset so its latest timestamp == selected end time
  function shiftRowsToEnd(rows, targetEndMoment) {
    if (!rows?.length) return [];
    const moments = rows
      .map(r => parseGovDate(r.lastUpdated || r.updatedAt || r.timestamp || r.time))
      .filter(m => m && m.isValid());
    if (moments.length === 0) return rows;

    const baseMax = moment.max(moments);
    const deltaMs = targetEndMoment.valueOf() - baseMax.valueOf();
    if (!Number.isFinite(deltaMs) || deltaMs === 0) return rows;

    return rows.map(r => {
      const m = parseGovDate(r.lastUpdated || r.updatedAt || r.timestamp || r.time);
      if (!m || !m.isValid()) return r;
      const shifted = moment(m.valueOf() + deltaMs);
      return { ...r, lastUpdated: formatGovDate(shifted) };
    });
  }

  function inRange(dateString, start, end) {
    const m = parseGovDate(dateString);
    return m.isValid() && m.isBetween(start, end, undefined, '[]');
  }

  function filterByRangeAndPorts(rows, { start, end }, ports) {
    const restrictPorts = ports?.length > 0;
    const wanted = new Set((ports || []).map(p => String(p).toUpperCase()));
    return rows.filter(r => {
      const okDate = inRange(r.lastUpdated || r.updatedAt || r.timestamp || r.time, start, end);
      const okPort = !restrictPorts || wanted.has(String(r.portOfEntry).toUpperCase());
      return okDate && okPort;
    });
  }

  const pct    = (n, d) => (d > 0 ? (n * 100 / d) : 0);
  const pctStr = (n, d) => (d > 0 ? (n * 100 / d).toFixed(2) + '%' : '0.00%');

  // ----------------- CSV helpers -----------------
  const q       = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const joinCSV = arr => arr.join(',');
  const withBOM = s => '\uFEFF' + s; // Excel UTF-8 BOM

  function metadataLinesCSV({ title, rangeLabel, ports }) {
    const portsLabel = (ports && ports.length) ? ports.join('; ') : 'All ports';
    return [
      joinCSV([q(title)]),
      joinCSV([q(`Date range: ${rangeLabel}`)]),
      joinCSV([q(`Ports: ${portsLabel}`)]),
      '' // blank line
    ].join('\n');
  }

  // ----------------- summary route factory -----------------
  function registerSummary({ viewPath, getPath, postPath }) {
    // Store filters (dates + ports) from forms
router.post(postPath, (req, res) => {
  req.session.data = req.session.data || {};

  // Raw fields
  const rawStartDate = String(req.body['startDate'] || '').trim();
  const rawEndDate   = String(req.body['endDate']   || '').trim();
  const startHour    = String(req.body['startTime-hour']   || '').trim();
  const startMinute  = String(req.body['startTime-minute'] || '').trim();
  const endHour      = String(req.body['endTime-hour']     || '').trim();
  const endMinute    = String(req.body['endTime-minute']   || '').trim();

  // Ports
  const selectedPorts = Array.isArray(req.body.portOfEntry)
    ? req.body.portOfEntry
    : (req.body.portOfEntry ? [req.body.portOfEntry] : []);
  req.session.data.selectedPorts = (selectedPorts || []).filter(v => v && v !== '_unchecked');

  // Validate dates ONLY if both provided
  let validDates = false;
  if (rawStartDate && rawEndDate) {
    const s = moment(`${rawStartDate} ${startHour || '00'}:${startMinute || '00'}`, 'DD/MM/YYYY HH:mm', true);
    const e = moment(`${rawEndDate} ${endHour   || '23'}:${endMinute   || '59'}`,   'DD/MM/YYYY HH:mm', true);
    if (s.isValid() && e.isValid()) {
      validDates = true;

      // Persist dates & times
      req.session.data.startDate = rawStartDate;
      req.session.data.endDate   = rawEndDate;
      req.session.data.startTime = { hour: startHour || '00', minute: startMinute || '00' };
      req.session.data.endTime   = { hour: endHour   || '23', minute: endMinute   || '59' };

      // Friendly label
      const sameDay = s.isSame(e, 'day');
      req.session.data.displayDateRange = sameDay
        ? `${s.format('HH:mm')} to ${e.format('HH:mm')} on ${s.format('D MMMM YYYY')}`
        : `${s.format('D MMMM YYYY')} at ${s.format('HH:mm')} to ${e.format('D MMMM YYYY')} at ${e.format('HH:mm')}`;
    }
  }

  // If dates invalid/empty, wipe them completely so inputs show blank
  if (!validDates) {
    delete req.session.data.startDate;
    delete req.session.data.endDate;
    delete req.session.data.startTime;
    delete req.session.data.endTime;
    delete req.session.data.displayDateRange;
  }

  // Only mark results true if user actually set valid dates OR picked ports
  const hasUserFilters = validDates || (req.session.data.selectedPorts && req.session.data.selectedPorts.length > 0);
  req.session.data.searchResults = !!hasUserFilters;

  res.redirect(getPath);
});

    // Render with computed stats (only if user has applied filters)
    router.get(getPath, (req, res) => {
      req.session.data = req.session.data || {};

      // Always offer ports (v1 can hide UI)
      req.session.data.portOptions = getUniquePorts();
      const ports = cleanSelectedPorts(req);

      // Build range (fallback used for labels only; we still need to know if the user set dates)
      const range = getDateRangeFromSession(req, {
        start: moment().subtract(1, 'month'),
        end:   moment(),
        label: 'last month'
      });

      // Only show results if the user actually set anything
      const hasUserFilters = !!(range.usedSession || (ports && ports.length > 0) || req.session.data.searchResults === true);

      if (!hasUserFilters) {
        // Ensure empty state on first load (or after clear)
        req.session.data.searchResults = false;
        delete req.session.data.stats;
        delete req.session.data.displayDateRange;
        return res.render(viewPath, { data: req.session.data });
      }

      // Read seeds (large file for main stats; manual releases if present)
      const noMatchesSeed = readJsonSafe(path.join(DATA_DIR, FILE_NO_MATCHES_LARGE));
      const manualSeed    = readJsonSafe(path.join(DATA_DIR, FILE_MANUAL));

      // Align timestamps to chosen end time
      const noMatchesAll = shiftRowsToEnd(noMatchesSeed, range.end);
      const manualAll    = shiftRowsToEnd(manualSeed,    range.end);

      // Apply filters (ports + date)
      const noMatches = filterByRangeAndPorts(noMatchesAll, range, ports);
      const manual    = filterByRangeAndPorts(manualAll,    range, ports);

      // ---- SIMULATION DIALS ----
      const NO_MATCH_RATE     = 0.0496;      // 4.96% of line items
      const MANUAL_RATE       = 0.0151;      // 1.51% of releases
      const UNIQUE_RATIO_INV  = 1 / 0.665;   // total msgs ≈ unique / 0.665
      const PRENOT_PER_LINE   = 5.2;         // prenotifications per line item
      const CHED = { A:0.0352, P:0.7598, PP:0.1640, D:0.0410 };

      // Line items from real 'noMatches'
      const nmCount        = noMatches.length;
      const totalLineItems = nmCount > 0 ? Math.round(nmCount / NO_MATCH_RATE) : 0;
      const matchCount     = Math.max(totalLineItems - nmCount, 0);
      const matchPctN      = pct(matchCount, totalLineItems);
      const nmPctN         = pct(nmCount,    totalLineItems);

      // Releases from real 'manual'
      const manualCount  = manual.length;
      let totalReleases  = manualCount > 0 ? Math.round(manualCount / MANUAL_RATE) : Math.round(totalLineItems * 0.87);
      if (totalReleases < manualCount) totalReleases = manualCount; // guard
      const autoCount    = Math.max(totalReleases - manualCount, 0);
      const autoPctN     = pct(autoCount,   totalReleases);
      const manPctN      = pct(manualCount, totalReleases);

      // Unique clearance requests
      const uniqueClearances = totalLineItems;
      const totalClearMsgs   = Math.round(uniqueClearances * UNIQUE_RATIO_INV);
      const uniquePctN       = pct(uniqueClearances, totalClearMsgs);

      // CHED breakdown
      const prenotTotal = Math.round(totalLineItems * PRENOT_PER_LINE);
      const chedA  = Math.round(prenotTotal * CHED.A);
      const chedP  = Math.round(prenotTotal * CHED.P);
      const chedPP = Math.round(prenotTotal * CHED.PP);
      const chedD  = Math.round(prenotTotal * CHED.D);
      const chedTotal = chedA + chedP + chedPP + chedD;

      req.session.data.stats = {
        // Matches
        matches: matchCount,
        noMatches: nmCount,
        totalLineItems,
        matchesPct:  (matchPctN).toFixed(2) + '%',
        noMatchesPct: (nmPctN).toFixed(2) + '%',

        // Releases
        autoReleases:    autoCount,
        manualReleases:  manualCount,
        totalReleases:   totalReleases,
        autoPct:   (autoPctN).toFixed(2) + '%',
        manualPct: (manPctN).toFixed(2) + '%',

        // Unique clearances
        uniqueClearances,
        totalClearanceMsgs: totalClearMsgs,
        uniquePct: (uniquePctN).toFixed(2) + '%',

        // CHED
        ched: {
          A:  { count: chedA,  pct: pctStr(chedA,  chedTotal) },
          P:  { count: chedP,  pct: pctStr(chedP,  chedTotal) },
          PP: { count: chedPP, pct: pctStr(chedPP, chedTotal) },
          D:  { count: chedD,  pct: pctStr(chedD,  chedTotal) },
          total: chedTotal
        }
      };

      // Display range label + ensure results show
      req.session.data.displayDateRange = formatRangeLabel(
        range.start, range.end, range.usedSession, range.fallbackLabel
      );
      req.session.data.searchResults = true;

      res.render(viewPath, { data: req.session.data });
    });
  }

  // ----------------- register summary routes -----------------
  registerSummary({
    viewPath: 'mvp/v4/reporting/summary-view',
    getPath:  '/mvp/v4/reporting/summary-view',
    postPath: '/mvp/v4/reporting/summary-view'
  });

  registerSummary({
    viewPath: 'mvp/v4/reporting/summary-view-v2',
    getPath:  '/mvp/v4/reporting/summary-view-v2',
    postPath: '/mvp/v4/reporting/summary-view-v2'
  });

  // ----------------- table routes -----------------
  router.get('/mvp/v4/reporting/no-matches', (req, res) => {
    const file = path.join(process.cwd(), DATA_DIR, 'no-matches.json');
    let allRows = [];
    try {
      allRows = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      console.error('Failed to read no-matches.json:', e.message);
    }

    const pageSize = 25;
    const page  = Math.max(1, parseInt(req.query.page || '1', 10));
    const total = allRows.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const start = Math.min((page - 1) * pageSize, Math.max(total - 1, 0));
    const end   = Math.min(start + pageSize, total);
    const rows  = allRows.slice(start, end);

    res.render('mvp/v4/reporting/no-matches', {
      rows,
      total,
      pagination: {
        page,
        pages,
        prev: page > 1 ? page - 1 : null,
        next: page < pages ? page + 1 : null,
        window: Array.from({ length: pages }, (_, i) => i + 1)
      },
      displayRange: total ? `Showing ${start + 1} to ${end} of ${total}` : ''
    });
  });

  router.get('/mvp/v4/reporting/no-matches-basic', (req, res) => {
    const file = path.join(process.cwd(), DATA_DIR, FILE_NO_MATCHES_SMALL);
    let raw = [];
    try {
      raw = JSON.parse(fs.readFileSync(file, 'utf8')) || [];
    } catch (e) {
      console.error('Failed to read no-matches-basic.json:', e.message);
      raw = [];
    }

    const shifted = shiftRowsToEnd(raw, moment());

    const rowsNormalised = shifted.map(r => ({
      mrn: r.mrn || '',
      portOfEntry: r.portOfEntry || '',
      lastUpdated: r.lastUpdated || ''
    }));

    rowsNormalised.sort((a, b) => {
      const ma = parseGovDate(a.lastUpdated);
      const mb = parseGovDate(b.lastUpdated);
      if (ma && mb) return mb.valueOf() - ma.valueOf();
      if (ma && !mb) return -1;
      if (!ma && mb) return 1;
      return 0;
    });

    const pageSize = 50;
    const page       = Math.max(1, parseInt(req.query.page || '1', 10));
    const total      = rowsNormalised.length;
    const pages      = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = Math.min((page - 1) * pageSize, Math.max(total - 1, 0));
    const endIndex   = Math.min(startIndex + pageSize, total);
    const rows       = rowsNormalised.slice(startIndex, endIndex);

    const pagination = {
      page,
      pages,
      prev: page > 1 ? page - 1 : null,
      next: page < pages ? page + 1 : null,
      window: Array.from({ length: pages }, (_, i) => i + 1)
    };

    res.render('mvp/v4/reporting/no-matches-basic', {
      rows,
      total,
      pagination,
      pageSize,
      startIndex,
      endIndex,
      displayRange: total ? `Showing ${startIndex + 1} to ${endIndex} of ${total}` : ''
    });
  });

  // ----------------- CSV: No matches (respects date + ports) -----------------
  router.get('/mvp/v4/reporting/no-matches-basic.csv', (req, res) => {
    const seedRows = readJsonSafe(path.join(DATA_DIR, FILE_NO_MATCHES_LARGE));

    const range = getDateRangeFromSession(req, {
      start: moment().subtract(1, 'month'),
      end:   moment(),
      label: 'last month'
    });

    const ports = cleanSelectedPorts(req);

    const shifted = shiftRowsToEnd(seedRows, range.end);
    const rows = filterByRangeAndPorts(shifted, range, ports);

    const meta = metadataLinesCSV({
      title: 'BTMS — No matches MRNs',
      rangeLabel: formatRangeLabel(
        range.start,
        range.end,
        range.usedSession,
        range.fallbackLabel
      ),
      ports
    });

    const header = joinCSV(['MRN','Port of entry','Last updated']);
    const body = rows
      .map(r => joinCSV([q(r.mrn), q(r.portOfEntry), q(r.lastUpdated)]))
      .join('\n');

    const csv = `${meta}\n${header}\n${body}\n`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Disposition', 'attachment; filename="no-matches.csv"');
    res.send(withBOM(csv));
  });

  // ----------------- CSV: Manual releases -----------------
  router.get('/mvp/v4/reporting/manual-release.csv', (req, res) => {
    const seedRows = readJsonSafe(path.join(DATA_DIR, FILE_MANUAL));

    const respectRange = String(req.query.respectRange || '').trim() === '1';
    const range = getDateRangeFromSession(req);
    const ports = cleanSelectedPorts(req);

    let rows = shiftRowsToEnd(seedRows, range.end);

    if (ports.length > 0) {
      const want = new Set(ports.map(p => String(p).toUpperCase()));
      rows = rows.filter(r => want.has(String(r.portOfEntry).toUpperCase()));
    }

    if (respectRange) {
      rows = rows.filter(r => inRange(r.lastUpdated, range.start, range.end));
    }

    const meta = metadataLinesCSV({
      title: 'BTMS — Manual releases MRNs',
      rangeLabel: respectRange
        ? formatRangeLabel(range.start, range.end, range.usedSession, range.fallbackLabel)
        : 'all dates (date filter not applied)',
      ports
    });

    const header = joinCSV(['MRN','Port of entry','Last updated']);
    const body = rows.map(r => joinCSV([q(r.mrn), q(r.portOfEntry), q(r.lastUpdated)])).join('\n');
    const csv = `${meta}\n${header}\n${body}\n`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Disposition', 'attachment; filename="manual-release.csv"');
    res.send(withBOM(csv));
  });

  // ----------------- Search results passthrough -----------------
  router.get('/mvp/v4/search-results', (req, res) => {
    const { mrn, cc, desc, ched, auth, updated } = req.query;

    let displayUpdated = '';
    if (updated) {
      const m = parseGovDate(updated);
      displayUpdated = m.isValid() ? m.format('D MMMM YYYY, HH:mm') : updated;
    }

    res.render('mvp/v4/search-results', {
      title: mrn || 'Search results',
      headerLastUpdated: displayUpdated,
      line: {
        commodityCode: cc   || '',
        description:   desc || '',
        chedRef:       ched || '',
        authority:     auth || '',
        lastUpdated:   displayUpdated
      }
    });
  });

  // === Chart data endpoint (JSON) ===
  // Returns hour-bucketed series based on current filters (date/time + ports).
  router.get('/mvp/v4/reporting/chart-data.json', (req, res) => {
    const NO_MATCH_RATE     = 0.0496;
    const MANUAL_RATE       = 0.0151;
    const UNIQUE_RATIO_INV  = 1 / 0.665;
    const PRENOT_PER_LINE   = 5.2;
    const CHED = { A:0.0352, P:0.7598, PP:0.1640, D:0.0410 };

    const range = getDateRangeFromSession(req, {
      start: moment().subtract(1, 'month'),
      end:   moment(),
      label: 'last month'
    });

    const ports = cleanSelectedPorts(req);

    const noMatchesSeed = readJsonSafe(path.join('app/data', 'no-matches-basic-large.json'));
    const manualSeed    = readJsonSafe(path.join('app/data', 'manual-release.json'));

    const noMatchesAll = shiftRowsToEnd(noMatchesSeed, range.end);
    const manualAll    = shiftRowsToEnd(manualSeed,    range.end);

    const noMatches = filterByRangeAndPorts(noMatchesAll, range, ports);
    const manual    = filterByRangeAndPorts(manualAll,    range, ports);

    function bucketByHour(rows) {
      const map = new Map(); // key "YYYY-MM-DD HH"
      rows.forEach(r => {
        const m = parseGovDate(r.lastUpdated || r.updatedAt || r.timestamp || r.time);
        if (!m?.isValid?.()) return;
        const key = m.format('YYYY-MM-DD HH');
        map.set(key, (map.get(key) || 0) + 1);
      });
      return map;
    }

    const nmHourly     = bucketByHour(noMatches);
    const manualHourly = bucketByHour(manual);

    const labels = [];
    const hours  = [];
    const startH = range.start.clone().startOf('hour');
    const endH   = range.end.clone().startOf('hour');
    for (let t = startH.clone(); t.isSameOrBefore(endH); t.add(1, 'hour')) {
      labels.push(t.format('HH:00'));
      hours.push(t.format('YYYY-MM-DD HH'));
    }
    if (labels.length === 0) {
      for (let h = 0; h < 24; h++) {
        labels.push(String(h).padStart(2, '0') + ':00');
        hours.push('fake-' + String(h).padStart(2, '0'));
      }
    }

    const noMatchesSeries       = hours.map(h => nmHourly.get(h) || 0);
    const totalLineItemsSeries  = noMatchesSeries.map(nm => Math.round(nm / NO_MATCH_RATE));
    const matchesSeries         = totalLineItemsSeries.map((t,i) => Math.max(t - noMatchesSeries[i], 0));

    const manualSeries          = hours.map(h => manualHourly.get(h) || 0);
    const totalReleasesSeries   = manualSeries.map(mn => Math.max(Math.round(mn / MANUAL_RATE), mn));
    const autoSeries            = totalReleasesSeries.map((tr,i) => Math.max(tr - manualSeries[i], 0));

    const uniqueSeries          = totalLineItemsSeries;
    const totalMsgsSeries       = uniqueSeries.map(u => Math.round(u * UNIQUE_RATIO_INV));

    const prenotSeries = totalLineItemsSeries.map(tli => Math.round(tli * PRENOT_PER_LINE));
    const chedASeries  = prenotSeries.map(n => Math.round(n * CHED.A));
    const chedPSeries  = prenotSeries.map(n => Math.round(n * CHED.P));
    const chedPPSeries = prenotSeries.map(n => Math.round(n * CHED.PP));
    const chedDSeries  = prenotSeries.map(n => Math.round(n * CHED.D));

    res.json({
      labels,
      series: {
        matches: matchesSeries,
        noMatches: noMatchesSeries,
        releases: {
          auto: autoSeries,
          manual: manualSeries,
          total: totalReleasesSeries
        },
        clearances: {
          unique: uniqueSeries,
          totalMsgs: totalMsgsSeries
        },
        ched: {
          A: chedASeries,
          P: chedPSeries,
          PP: chedPPSeries,
          D: chedDSeries
        }
      }
    });
  });



};
