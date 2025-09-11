// app/routes/mvp/v4/reporting/releases-mvp.js
const moment = require('moment');

module.exports = (router) => {
  router.get('/mvp/v4/reporting/releases-mvp', (req, res) => {
    // Yesterday (local time)
    const start = moment().subtract(1, 'day').startOf('day');
    const end   = moment().subtract(1, 'day').hour(23).minute(59);

    const rangeFmt = 'D MMMM YYYY [at] HH:mm';

    const data = {
      displayDateRange: `${start.format(rangeFmt)} to ${end.format(rangeFmt)}`
    };

    res.render('mvp/v4/reporting/summary-view-mvp.html', { data });
  });
};
