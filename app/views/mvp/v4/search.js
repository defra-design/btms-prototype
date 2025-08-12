const _ = require('lodash');
const moment = require('moment');

module.exports = (router) => {
  router.post(['/mvp/v4/search/'], (req, res, next) => {
    const data = req.session.data;
    const search = req.body['data.searchTerm'] || req.query.searchTerm;

    // Patterns
    const mrnPattern = /^24GB[A-Z0-9]{12}$/;
    const chedPattern = /^(CHED(P|PP)?\.GB\.\d{4}\.\d+|GBCHD\d{4}\.\d+)$/;
    const ducrPattern = /^[A-Z0-9]{1,35}-[A-Z0-9]{1,35}$/;

    // Reset error state before processing
    delete data.error;
    delete data.errorMessage;

    // Valid redirections
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

    // Redirect if recognised
    if (searchRedirects[search]) {
      data.searchTerm = search;
      return res.redirect(searchRedirects[search]);
    }

    // Error handling
    if (!search || search.trim() === '') {
      data.error = 'true';
      data.errorMessage = 'Enter an MRN, CHED or DUCR reference';
      data.searchTerm = '';
    } else if (
      !mrnPattern.test(search) &&
      !chedPattern.test(search) &&
      !ducrPattern.test(search)
    ) {
      data.error = 'true';
      data.errorMessage = 'Enter an MRN, CHED or DUCR reference in the correct format';
      data.searchTerm = search;
    } else {
      data.error = 'true';
      data.errorMessage = `${search} cannot be found`;
      data.searchTerm = search;
    }

    return res.redirect('search');
  });

  router.post(['/mvp/v4/cookies/'], (req, res) => {
    const cookies = req.body.cookies;
    res.render('mvp/v4/cookies', { cookies });
  });

  router.post(['/mvp/v4/search-cookies', '/mvp/v4/search-cookies/'], (req, res) => {
    const preference = req.body.cookies;

    if (preference === 'Yes' || preference === 'No') {
      res.cookie('cookiePreference', preference, {
        maxAge: 365 * 24 * 60 * 60 * 1000
      });
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

  router.post(['/mvp/v4/sign-in-choose'], (req, res) => {
    const selected = req.body.signIn;

    if (selected === 'entra') {
      res.redirect('/mvp/v4/sign-in-entra');
    } else if (selected === 'gg') {
      res.redirect('/mvp/v4/sign-in-gg');
    } else {
      res.render('mvp/v4/sign-in-choose', {
        data: { signIn: '' },
        errorMessage: 'Select how you want to sign in'
      });
    }
  });

  router.post(['/mvp/v4/sign-out'], (req, res) => {
    const selected = req.body.signIn;

    if (selected === 'entra') {
      res.redirect('/mvp/v4/sign-in-entra');
    } else if (selected === 'gg') {
      res.redirect('/mvp/v4/sign-in-gg');
    } else {
      res.render('mvp/v4/sign-in-choose', {
        data: { signIn: '' },
        errorMessage: 'Select how you want to sign in'
      });
    }
  });



};
