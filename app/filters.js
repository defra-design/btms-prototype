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
//              {{ "" | ipaffsTime("-2min:30") }} -> 2min 30sec ago (for seconds control)
//              {{ "" | ipaffsTime("-2min:51") }} -> 2min 51sec ago
addFilter('ipaffsTime', function (value, offsetStr) {
  const arg = (typeof offsetStr !== 'undefined') ? offsetStr : value;
  try {
    let offsetMinutes = -80;
    let offsetSeconds = 0;
    let secondsExplicitlySet = false;
    
    if (typeof arg === 'string' && arg.trim()) {
      // Check for format with seconds: "-2min:30" or "-2:30"
      const withSeconds = arg.trim().match(/^([+-]?)(\d+)(?:min)?:(\d+)$/i);
      if (withSeconds) {
        let [, sign, v, secs] = withSeconds;
        let minutes = parseInt(v, 10);
        let seconds = parseInt(secs, 10);
        if (sign === '-') {
          offsetMinutes = -minutes;
          offsetSeconds = -seconds;
        } else {
          offsetMinutes = +minutes;
          offsetSeconds = +seconds;
        }
        secondsExplicitlySet = true;
      } else {
        // Original format without seconds
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
    }

    const d = new Date();
    d.setUTCMinutes(d.getUTCMinutes() + offsetMinutes);
    
    // If seconds weren't explicitly specified, randomize them (0-59)
    if (!secondsExplicitlySet) {
      offsetSeconds = Math.floor(Math.random() * 60);
    }
    
    d.setUTCSeconds(d.getUTCSeconds() + offsetSeconds);

    // Format explicitly in UK time with seconds (GOV.UK format: DD Month YYYY, HH:MM:SS)
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(d);
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const year = parts.find(p => p.type === 'year').value;
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    const second = parts.find(p => p.type === 'second').value;
    
    return `${day} ${month} ${year}, ${hour}:${minute}:${second}`;

  } catch (e) {
    return (e?.message || 'Error').split(':')[0];
  }
});

// app/filters.js
module.exports = function (env) {
  function pretty(obj) {
    return JSON.stringify(obj, null, 2)
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  env.addGlobal('renderJsonLines', function (obj) {
    const lines = pretty(obj).split('\n');
    const li = lines.map(l => `<li><code>${l || ' '}</code></li>`).join('');
    return `<ol class="codeblock">${li}</ol>`;
  });
};


/* ----------------------------------------------------------- */

// The Prototype Kit will load this file. We register filters above via addFilter.
// Returning an empty object keeps compatibility with older setups.
module.exports = function (env) {
  return {};
};
