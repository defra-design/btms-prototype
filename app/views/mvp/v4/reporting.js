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

      // Dates/times
      const rawStartDate = req.body['startDate'] || '';
      const rawEndDate   = req.body['endDate']   || '';
      const startHour    = req.body['startTime-hour']   || '00';
      const startMinute  = req.body['startTime-minute'] || '00';
      const endHour      = req.body['endTime-hour']     || '23';
      const endMinute    = req.body['endTime-minute']   || '59';

      req.session.data.startDate = rawStartDate;
      req.session.data.endDate   = rawEndDate;
      req.session.data.startTime = { hour: startHour, minute: startMinute };
      req.session.data.endTime   = { hour: endHour,   minute: endMinute };

      const s = moment(`${rawStartDate} ${startHour}:${startMinute}`, 'DD/MM/YYYY HH:mm');
      const e = moment(`${rawEndDate} ${endHour}:${endMinute}`,       'DD/MM/YYYY HH:mm');

      const sameDay = s.isValid() && e.isValid() && s.isSame(e, 'day');
      req.session.data.displayDateRange = sameDay
        ? `${s.format('HH:mm')} to ${e.format('HH:mm')} on ${s.format('D MMMM YYYY')}`
        : `${s.format('D MMMM YYYY')} at ${s.format('HH:mm')} to ${e.format('D MMMM YYYY')} at ${e.format('HH:mm')}`;

      // Ports (always capture; safe if UI hidden)
      const selectedPorts = Array.isArray(req.body.portOfEntry)
        ? req.body.portOfEntry
        : (req.body.portOfEntry ? [req.body.portOfEntry] : []);
      req.session.data.selectedPorts = (selectedPorts || []).filter(v => v && v !== '_unchecked');

      req.session.data.searchResults = 'true';
      res.redirect(getPath);
    });

    // Render with computed stats
    router.get(getPath, (req, res) => {
      req.session.data = req.session.data || {};

      // Always offer ports (v1 can hide UI)
      req.session.data.portOptions = getUniquePorts();
      const ports = cleanSelectedPorts(req);

      // Default to last month if unset
      const range = getDateRangeFromSession(req, {
        start: moment().subtract(1, 'month'),
        end:   moment(),
        label: 'last month'
      });

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
      req.session.data.displayDateRange = formatRangeLabel(range.start, range.end, range.usedSession, range.fallbackLabel);
      if (typeof req.session.data.searchResults === 'undefined') {
        req.session.data.searchResults = 'true';
      }

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
};
