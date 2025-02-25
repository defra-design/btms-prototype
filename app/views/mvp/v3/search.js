const _ = require('lodash');

module.exports = (router) => {
  router.post(['/mvp/v3/search/'], (req, res, next) => {
    const data = req.session.data;
    const search = req.body['data.searchTerm'] || req.query.searchTerm; // Support both body and query params
    
    // Reset the error state BEFORE processing
    delete data.error;
    delete data.errorMessage;

    // Define valid search cases for redirection
    const searchRedirects = {
      '24GB0Z8WEJ9ZBTL73B': 'mrn',
      '4GB335031931000-WB2408-27WWL6274S': 'ducr',
      'CHEDP.GB.2025.5403171': 'mrn-auth',
      '24GBDX8QQ4WWFZNAR3': 'mrn-tri-auth',
      'CHEDPP.GB.2025.5426583': 'no-mrn',
      '25GB0P0TEP7CZCNAR6': 'no-ched'
    };

    // Check if search term exists in predefined redirects
    if (searchRedirects[search]) {
      req.session.data.searchTerm = search; // Save search term to session
      return res.redirect(searchRedirects[search]);
    }

    // Define error cases
    const errorCases = {
      '25GB0P0T': 'Enter a valid MRN or CHED reference in the correct format',
      '': 'Enter an MRN or CHED reference',
      'CHEDP.GB.2024.4433124': 'This MRN or CHED reference cannot be found',
      '24GBDX8QQ4WWFJHGA4': 'This MRN or CHED reference cannot be found'
    };

    // If the search term is one of the error cases, set the error message
    if (errorCases.hasOwnProperty(search)) {
      data.error = 'true';
      data.errorMessage = errorCases[search];
      data.searchTerm = search; // Save search term to session
      return res.redirect('search');
    }

    // For any other search term (not in redirects or error cases), show a general error message
    data.error = 'true';
    data.errorMessage = 'You must enter a valid MRN or CHED';
    data.searchTerm = search; // Save search term to session
    return res.redirect('search');
  });


  
};