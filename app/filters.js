// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//
module.exports = (env) => {
  env.addGlobal('govukRebrand', true)
}
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
