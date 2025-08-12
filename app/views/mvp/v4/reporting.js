// app/routes/mvp/v4/reporting.js
const fs = require('fs');
const path = require('path');
const _ = require('lodash'); // (optional; remove if unused)
const moment = require('moment');

module.exports = (router) => {
  console.log('[routes] reporting.js loaded');

  // ----- Reporting: Summary view -----
  router.post(['/mvp/v4/reporting/summary-view'], (req, res) => {
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
    const endDateTime   = moment(`${rawEndDate} ${endHour}:${endMinute}`,   'DD/MM/YYYY HH:mm');

    const sameDay = startDateTime.isSame(endDateTime, 'day');
    req.session.data.displayDateRange = sameDay
      ? `Showing results from ${startDateTime.format('HH:mm')} to ${endDateTime.format('HH:mm')} on ${startDateTime.format('D MMMM YYYY')}`
      : `Showing results from ${startDateTime.format('D MMMM YYYY')} at ${startDateTime.format('HH:mm')} to ${endDateTime.format('D MMMM YYYY')} at ${endDateTime.format('HH:mm')}`;

    req.session.data.searchResults = 'true';
    res.redirect('/mvp/v4/reporting/summary-view');
  });

  router.get(['/mvp/v4/reporting/summary-view'], (req, res) => {
    req.session.data = req.session.data || {};
    res.render('mvp/v4/reporting/summary-view', { data: req.session.data });
  });

 router.get(['/mvp/v4/reporting/no-matches'], (req, res) => {
  // go to project root, then app/data/no-matches.json
  const file = path.join(process.cwd(), 'app', 'data', 'no-matches.json');
  console.log('[routes] reading:', file);

  let allRows = [];
  try {
    allRows = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('Failed to read no-matches.json:', e);
  }

  const pageSize = 25;
  const page  = parseInt(req.query.page || 1, 10);
  const total = allRows.length;
  const start = (page - 1) * pageSize;
  const rows  = allRows.slice(start, start + pageSize);

  console.log('[routes] no-matches rows:', total);

  res.render('mvp/v4/reporting/no-matches', {
    rows, total,
    pagination: {
      page,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      prev: page > 1 ? page - 1 : null,
      next: page < Math.ceil(total / pageSize) ? page + 1 : null,
      window: Array.from({length: Math.max(1, Math.ceil(total / pageSize))}, (_, i) => i + 1)
    },
    displayRange: total ? `Showing ${start + 1} to ${Math.min(start + pageSize, total)} of ${total}` : ''
  });
});




router.get('/mvp/v4/search-results', (req, res) => {
  const { mrn, cc, desc, ched, auth, updated } = req.query;

  res.render('mvp/v4/search-results', {
    title: mrn || 'Search results',
    line: {
      commodityCode: cc || '',
      description:   desc || '',
      chedRef:       ched || '',
      authority:     auth || '',
      lastUpdated:   updated || ''
    }
  });
});
};
