// app/routes/mvp/v4/reporting.js
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const moment = require('moment');

module.exports = (router) => {
  console.log('[routes] reporting.js loaded');

  // --- helper: get distinct ports from data/no-matches-basic.json ---
  function getUniquePorts() {
    const file = path.join(process.cwd(), 'app', 'data', 'no-matches-basic.json');
    try {
      const rows = JSON.parse(fs.readFileSync(file, 'utf8')) || [];
      const ports = rows.map(r => r.portOfEntry).filter(Boolean);
      return _.sortBy(_.uniq(ports)); // alphabetical
    } catch (e) {
      console.error('[reporting] failed to read ports:', e.message);
      return [];
    }
  }

  // --- Helper to register a pair of GET/POST routes for a summary view ---
  const registerSummary = ({ viewPath, getPath, postPath, isV2 = false }) => {
    router.post(postPath, (req, res) => {
      req.session.data = req.session.data || {};

      // ----- dates/times -----
const moment = require('moment');

// If form fields are provided, use them. Otherwise default to "last 24 hours"
const now = moment();
const twentyFourHoursAgo = moment().subtract(24, 'hours');

const rawStartDate = req.body['startDate'] || twentyFourHoursAgo.format('DD/MM/YYYY');
const rawEndDate   = req.body['endDate']   || now.format('DD/MM/YYYY');

const startHour    = req.body['startTime-hour']   || twentyFourHoursAgo.format('HH');
const startMinute  = req.body['startTime-minute'] || twentyFourHoursAgo.format('mm');
const endHour      = req.body['endTime-hour']     || now.format('HH');
const endMinute    = req.body['endTime-minute']   || now.format('mm');

      req.session.data.startDate = rawStartDate;
      req.session.data.endDate   = rawEndDate;
      req.session.data.startTime = { hour: startHour, minute: startMinute };
      req.session.data.endTime   = { hour: endHour,   minute: endMinute };

      const startDateTime = moment(`${rawStartDate} ${startHour}:${startMinute}`, 'DD/MM/YYYY HH:mm');
      const endDateTime   = moment(`${rawEndDate} ${endHour}:${endMinute}`,     'DD/MM/YYYY HH:mm');

      const sameDay = startDateTime.isSame(endDateTime, 'day');
      req.session.data.displayDateRange = sameDay
        ? `${startDateTime.format('HH:mm')} to ${endDateTime.format('HH:mm')} on ${startDateTime.format('D MMMM YYYY')}`
        : `${startDateTime.format('D MMMM YYYY')} at ${startDateTime.format('HH:mm')} to ${endDateTime.format('D MMMM YYYY')} at ${endDateTime.format('HH:mm')}`;

      // ----- v2-only: persist selected ports, removing the hidden marker -----
      if (isV2) {
        let selected = req.body.portOfEntry || [];
        if (!Array.isArray(selected)) selected = [selected];
        // remove the prototype-kit hidden marker and empties
        selected = selected.filter(v => v && v !== '_unchecked');
        req.session.data.selectedPorts = selected;
        console.log('[reporting v2] selectedPorts:', selected);
      }

      req.session.data.searchResults = 'true';
      return res.redirect(getPath);
    });

    router.get(getPath, (req, res) => {
      req.session.data = req.session.data || {};
      // v2: supply dynamic port options for building checkbox lists if needed
      if (isV2) {
        req.session.data.portOptions = getUniquePorts();
      }
      return res.render(viewPath, { data: req.session.data });
    });
  };

  // --- Summary view v1 ---
  registerSummary({
    viewPath: 'mvp/v4/reporting/summary-view',
    getPath:  '/mvp/v4/reporting/summary-view',
    postPath: '/mvp/v4/reporting/summary-view',
    isV2: false
  });

  // --- Summary view v2 (new) ---
  registerSummary({
    viewPath: 'mvp/v4/reporting/summary-view-v2',
    getPath:  '/mvp/v4/reporting/summary-view-v2',
    postPath: '/mvp/v4/reporting/summary-view-v2',
    isV2: true
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
      'D MMMM YYYY [at] h:mma',
      'D MMMM YYYY, HH:mm',
      moment.ISO_8601
    ];

    let displayUpdated = '';
    if (updated) {
      const m = moment(updated, parseFormats, true);
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

    // Normalise
    const rowsNormalised = raw.map(r => ({
      mrn: r.mrn || '',
      portOfEntry: r.portOfEntry || '',
      lastUpdated: r.lastUpdated || ''
    }));

    // Sort by lastUpdated (newest first)
    const parseGovDate = s => (s ? moment(s, 'D MMMM YYYY [at] h:mma', true) : null);
    rowsNormalised.sort((a, b) => {
      const ma = parseGovDate(a.lastUpdated);
      const mb = parseGovDate(b.lastUpdated);
      if (ma && mb) return mb.valueOf() - ma.valueOf();
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

  // NOTE: no duplicate POST for /summary-view-v2 below — handled via registerSummary above.
};
