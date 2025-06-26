const _ = require('lodash');

module.exports = (router) => {
  router.post(['/mvp/v4/search/'], (req, res, next) => {
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
      '25GB0P0TEP7CZCNAR6': 'no-ched',
      '25GB2XHHM4884KEAR1': 'scenario-1',
      '25GB1EU8XXNPKSTAR4': 'scenario-2',
      '25GB0KTW9JPEMO5AR0': 'scenario-3',
      '25GB2A3YROMOM5XAR6': 'scenario-4',
      '25GB25XEV402TZBAR5': 'gms',
      '25GB3FJBV1UEKBDAR0': 'multiple-auth',
      '25GB3HGVAICUT5YAR0': 'multiple-cheds-single-auth',
      '24GBDYHR49XV9BAFS1': 'filters-v4'
    };

    // Check if search term exists in predefined redirects
    if (searchRedirects[search]) {
      req.session.data.searchTerm = search; // Save search term to session
      return res.redirect(searchRedirects[search]);
    }

    // Define error cases
    const errorCases = {
      '25GB0P0T': 'Enter a valid MRN, CHED or DUCR reference in the correct format',
      '': 'Enter an MRN, CHED or DUCR reference',
      'CHEDP.GB.2024.4433124': 'This MRN, CHED or DUCR reference cannot be found',
      '24GBDX8QQ4WWFJHGA4': 'This MRN, CHED or DUCR reference cannot be found'
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
    data.errorMessage = 'Enter a valid MRN, CHED or DUCR reference in the correct format';
    data.searchTerm = search; // Save search term to session
    return res.redirect('search');
  });

  router.post(['/mvp/v4/cookies/'], (req, res, next) => {
  const cookies = req.body.cookies;

  // Do something with the preference (e.g., set a cookie)
    res.render('mvp/v4/cookies', {
    cookies
  });
});

router.post(['/mvp/v4/search-cookies', '/mvp/v4/search-cookies/'], (req, res) => {
  const preference = req.body.cookies;

  if (preference === 'Yes' || preference === 'No') {
    res.cookie('cookiePreference', preference, { maxAge: 365 * 24 * 60 * 60 * 1000 }); // 1 year
    return res.redirect('/mvp/v4/search-cookies?confirmation=true');
  }

  res.redirect('/mvp/v4/search-cookies');
});

router.get(['/mvp/v4/search-cookies', '/mvp/v4/search-cookies/'], (req, res) => {
  const cookies = req.cookies.cookiePreference || '';
  const showConfirmation = req.query.confirmation === 'true';

  res.render('mvp/v4/search-cookies', {
    serviceName: 'Border Trade Matching Service',
    cookies,
    showConfirmation
  });
});







};