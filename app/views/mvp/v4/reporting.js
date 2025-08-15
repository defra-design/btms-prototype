// app/routes/mvp/v4/reporting.js
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const moment = require('moment');

module.exports = (router) => {
  console.log('[routes] reporting.js loaded');

  // --- Summary view ---
  router.post('/mvp/v4/reporting/summary-view', (req, res) => {
    req.session.data = req.session.data || {};

    const rawStartDate = req.body['startDate'] || '29/06/2025';
    const rawEndDate   = req.body['endDate']   || '30/06/2025';
    const startHour    = req.body['startTime-hour']   || '00';
    const startMinute  = req.body['startTime-minute'] || '00';
    const endHour      = req.body['endTime-hour']     || '23';
    const endMinute    = req.body['endTime-minute']   || '59';

    req.session.data.startDate = rawStartDate;
    req.session.data.endDate   = rawEndDate;
    req.session.data.startTime = { hour: startHour, minute: startMinute };
    req.session.data.endTime   = { hour: endHour,   minute: endMinute };

    const startDateTime = moment(`${rawStartDate} ${startHour}:${startMinute}`, 'DD/MM/YYYY HH:mm');
    const endDateTime   = moment(`${rawEndDate} ${endHour}:${endMinute}`,     'DD/MM/YYYY HH:mm');

    const sameDay = startDateTime.isSame(endDateTime, 'day');
    req.session.data.displayDateRange = sameDay
      ? `Showing results from ${startDateTime.format('HH:mm')} to ${endDateTime.format('HH:mm')} on ${startDateTime.format('D MMMM YYYY')}`
      : `Showing results from ${startDateTime.format('D MMMM YYYY')} at ${startDateTime.format('HH:mm')} to ${endDateTime.format('D MMMM YYYY')} at ${endDateTime.format('HH:mm')}`;

    req.session.data.searchResults = 'true';
    res.redirect('/mvp/v4/reporting/summary-view');
  });

  router.get('/mvp/v4/reporting/summary-view', (req, res) => {
    req.session.data = req.session.data || {};
    res.render('mvp/v4/reporting/summary-view', { data: req.session.data });
  });

  // --- No matches (full table) ---
  router.get('/mvp/v4/reporting/no-matches', (req, res) => {
    const file = path.join(process.cwd(), 'app', 'data', 'no-matches.json');
    console.log('[routes] no-matches reading:', file);

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

    console.log('[routes] no-matches total rows:', total);

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

// --- Search results (title = MRN, line data from query) ---
router.get('/mvp/v4/search-results', (req, res) => {
  const { mrn, cc, desc, ched, auth, updated } = req.query;

  // Accept several inputs and normalise to "D MMMM YYYY, HH:mm"
  const parseFormats = [
    'D MMMM YYYY [at] h:mma', // e.g. "15 August 2025 at 9:41am"
    'D MMMM YYYY, HH:mm',     // e.g. "15 August 2025, 09:41"
    moment.ISO_8601
  ];

  let displayUpdated = '';
  if (updated) {
    const m = moment(updated, parseFormats, true);
    displayUpdated = m.isValid() ? m.format('D MMMM YYYY, HH:mm') : updated;
  }

  res.render('mvp/v4/search-results', {
    title: mrn || 'Search results',
    headerLastUpdated: displayUpdated,  // <-- use this in the view header
    line: {
      commodityCode: cc   || '',
      description:   desc || '',
      chedRef:       ched || '',
      authority:     auth || '',
      lastUpdated:   displayUpdated     // if you also show it in the table/body
    }
  });
});


// --- No matches (basic: MRN / port / lastUpdated) ---
router.get('/mvp/v4/reporting/no-matches-basic', (req, res) => {
  console.log('[routes] HIT /mvp/v4/reporting/no-matches-basic');

  const file = path.join(process.cwd(), 'app', 'data', 'no-matches-basic.json');
  console.log('[routes] no-matches-basic reading:', file);

  let raw = [];
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8')) || [];
    console.log('[routes] no-matches-basic loaded rows:', raw.length);
  } catch (e) {
    console.error('Failed to read no-matches-basic.json:', e.message);
    raw = [];
  }

  // Normalise: keep only the fields we render and drop any legacy noMatchCount
  const rowsNormalised = raw.map(r => ({
    mrn: r.mrn || '',
    portOfEntry: r.portOfEntry || '',
    lastUpdated: r.lastUpdated || '' // e.g. "15 August 2025 at 9:41am"
  }));

  // Sort by lastUpdated (newest first)
  const parseGovDate = s => (s ? moment(s, 'D MMMM YYYY [at] h:mma', true) : null);
  rowsNormalised.sort((a, b) => {
    const ma = parseGovDate(a.lastUpdated);
    const mb = parseGovDate(b.lastUpdated);
    if (ma && mb) return mb.valueOf() - ma.valueOf(); // DESC (newest first)
    if (ma && !mb) return -1;
    if (!ma && mb) return 1;
    return 0;
  });

  // Pagination
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

  const displayRange = total ? `Showing ${startIndex + 1} to ${endIndex} of ${total}` : '';

  res.render('mvp/v4/reporting/no-matches-basic', {
    rows,
    total,
    pagination,
    pageSize,
    startIndex,
    endIndex,
    displayRange
  });
});

};
