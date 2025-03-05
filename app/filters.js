//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter


// Add your filters here
addFilter('chedTime', function() {
    try {
        const today = new Date();
        // Add 2 days to the current date
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

addFilter('mrnTime', function() {
    try {
        const today = new Date();
        // Add 2 days to the current date
        const twoDaysLater = new Date(today.setDate(today.getDate() - 1));
        // Subtract 3 hours from the current time
        twoDaysLater.setHours(twoDaysLater.getHours() - 1);

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