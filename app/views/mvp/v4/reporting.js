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

    res.render('mvp/v4/search-results', {
      title: mrn || 'Search results',
      line: {
        commodityCode: cc      || '',
        description:   desc    || '',
        chedRef:       ched    || '',
        authority:     auth    || '',
        lastUpdated:   updated || ''
      }
    });
  });

  // --- No matches (basic: MRN / count / port) ---
  router.get('/mvp/v4/reporting/no-matches-basic', (req, res) => {
    console.log('[routes] HIT /mvp/v4/reporting/no-matches-basic');

    const file = path.join(process.cwd(), 'app', 'data', 'no-matches-basic.json');
    console.log('[routes] no-matches-basic reading:', file);

    let raw = [];
    try {
      raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      console.log('[routes] no-matches-basic loaded rows:', raw.length);
    } catch (e) {
      console.error('Failed to read no-matches-basic.json:', e.message);
      raw = [];
    }

    // If file already has basic rows use as-is; otherwise aggregate by MRN
    let basics;
    if (raw.length && Object.prototype.hasOwnProperty.call(raw[0], 'noMatchCount')) {
      basics = raw.map(r => ({
        mrn: r.mrn,
        noMatchCount: Number(r.noMatchCount) || 0,
        portOfEntry: r.portOfEntry || ''
      }));
    } else {
      const grouped = _.groupBy(raw, 'mrn');
      basics = Object.entries(grouped).map(([mrn, items]) => {
        const withPort = items.find(i => i.portOfEntry && i.portOfEntry.trim() !== '');
        return {
          mrn,
          noMatchCount: items.length,
          portOfEntry: withPort ? withPort.portOfEntry : ''
        };
      });
    }

    // Pagination
    const pageSize = 25;
    const page       = Math.max(1, parseInt(req.query.page || '1', 10));
    const total      = basics.length;
    const pages      = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = Math.min((page - 1) * pageSize, Math.max(total - 1, 0));
    const endIndex   = Math.min(startIndex + pageSize, total);
    const rows       = basics.slice(startIndex, endIndex);

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
