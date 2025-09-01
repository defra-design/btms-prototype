// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit');
const addFilter = govukPrototypeKit.views.addFilter;

// Add your filters here

// Filter for chedTime (2 days ago, 3 hours earlier)
addFilter('chedTime', function() {
    try {
        const today = new Date();
        // Subtract 2 days from the current date
        const twoDaysLater = new Date(today.setDate(today.getDate() - 2));
        // Subtract 3 hours from the current time
        twoDaysLater.setHours(twoDaysLater.getHours() - 3);

        // Format the date
        const formattedDate = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }).format(twoDaysLater);
        // Format the time
        const formattedTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(twoDaysLater);

        // Combine date and time with a comma
        return `${formattedDate}, ${formattedTime}`;
    } catch (error) {
        return error.message.split(':')[0];
    }
});

module.exports = function (env) {
  const filters = {};

  filters.commas = (n) => {
    const num = Number(n || 0);
    return Number.isFinite(num) ? num.toLocaleString('en-GB') : n;
  };

  return filters;
};

// Filter for mrnTime (1 day ago, 1 hour earlier)
addFilter('mrnTime', function() {
    try {
        const today = new Date();
        // Subtract 1 day from the current date
        const oneDayEarlier = new Date(today.setDate(today.getDate() - 1));
        // Subtract 1 hour from the current time
        oneDayEarlier.setHours(oneDayEarlier.getHours() - 1);

        // Format the date
        const formattedDate = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }).format(oneDayEarlier);
        // Format the time
        const formattedTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(oneDayEarlier);

        // Combine date and time with a comma
        return `${formattedDate}, ${formattedTime}`;
    } catch (error) {
        return error.message.split(':')[0];
    }
});

// Filter for IPAFS time (1 hour and 20min earlier)
addFilter('ipaffsTime', function(offsetStr) {
    try {
        const date = new Date();

        // Default offset if none provided
        let offsetMinutes = -80; // 1hr 20min ago

        if (typeof offsetStr === 'string') {
            const match = offsetStr.match(/([+-])(\d+)(min|hr)/);
            if (match) {
                const [, sign, value, unit] = match;
                let minutes = parseInt(value, 10);
                if (unit === 'hr') minutes *= 60;
                offsetMinutes = (sign === '-' ? -1 : 1) * minutes;
            }
        }

        // Apply the offset
        date.setMinutes(date.getMinutes() + offsetMinutes);

        // Format date and time
        const formattedDate = new Intl.DateTimeFormat('en-GB', {
            year: 'numeric', month: 'long', day: 'numeric'
        }).format(date);

        const formattedTime = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit'
        }).format(date);

        return `${formattedDate}, ${formattedTime}`;
    } catch (error) {
        return error.message.split(':')[0];
    }
});
