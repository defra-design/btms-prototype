// app/filters.js
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters

const govukPrototypeKit = require('govuk-prototype-kit');
const addFilter = govukPrototypeKit.views.addFilter;

// Helper to format "D Month YYYY, HH:MM" in en-GB
function formatGB(date) {
  const d = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(date);

  const t = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit'
  }).format(date);

  return `${d}, ${t}`;
}

/* ------------------------- Filters ------------------------- */

// 1) 1,234 formatting
addFilter('commas', (input) => {
  const n = Number(input);
  return Number.isFinite(n) ? n.toLocaleString('en-GB') : (input ?? '');
});

// 2) chedTime — now minus 2 days and 3 hours
addFilter('chedTime', function () {
  try {
    const d = new Date();
    d.setDate(d.getDate() - 2);   // -2 days
    d.setHours(d.getHours() - 3); // -3 hours
    return formatGB(d);
  } catch (error) {
    return (error?.message || 'Error').split(':')[0];
  }
});

// 3) mrnTime — now minus 1 day and 1 hour
addFilter('mrnTime', function () {
  try {
    const d = new Date();
    d.setDate(d.getDate() - 1);   // -1 day
    d.setHours(d.getHours() - 1); // -1 hour
    return formatGB(d);
  } catch (error) {
    return (error?.message || 'Error').split(':')[0];
  }
});

// 4) ipaffsTime — default 1 hour 20 minutes ago, or accept an offset string
//    Examples: {{ "" | ipaffsTime }}        -> 1hr 20min ago
//              {{ "" | ipaffsTime("-30") }} -> 30min ago
//              {{ "" | ipaffsTime("-30min") }}
//              {{ "" | ipaffsTime("-2hr") }}  (or "-2hrs", "-2hour", "-2hours")
//              {{ "" | ipaffsTime("+15min") }} (future, for testing)
addFilter('ipaffsTime', function (value, offsetStr) {
  const arg = (typeof offsetStr !== 'undefined') ? offsetStr : value; // support both call styles
  try {
    const d = new Date();
    let offsetMinutes = -80;

    if (typeof arg === 'string' && arg.trim()) {
      const m = arg.trim().match(/^([+-]?)(\d+)(?:\s*)(min|hr|hrs|hour|hours)?$/i);
      if (m) {
        let [, sign, v, unit] = m;
        let minutes = parseInt(v, 10);
        if (unit && !/min/i.test(unit)) minutes *= 60;
        if (sign === '-') minutes = -minutes;
        if (sign === '+') minutes = +minutes;
        offsetMinutes = minutes;
      }
    }

    d.setMinutes(d.getMinutes() + offsetMinutes);
    return formatGB(d);
  } catch (e) {
    return (e?.message || 'Error').split(':')[0];
  }
});


/* ----------------------------------------------------------- */

// The Prototype Kit will load this file. We register filters above via addFilter.
// Returning an empty object keeps compatibility with older setups.
module.exports = function (env) {
  return {};
};
