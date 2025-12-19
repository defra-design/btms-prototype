const _ = require('lodash');
const moment = require('moment');

const searchRedirects = {
  '24GB0Z8WEJ9ZBTL73B': 'mrn',
  'GMRCQP7UIYNS': 'gmr-interstitial',
  'GMRA00002KW2': 'gmr-v1',
  '4GB335031931000-WB2408-27WWL6274S': 'ducr',
  'CHEDP.GB.2025.5403171': 'multiple-auth',
  '24GBDX8QQ4WWFZNAR3': 'mrn-tri-auth',
  'CHEDPP.GB.2025.5426583': 'no-mrn',
  '25GB0P0TEP7CZCNAR6': 'no-ched',
  '25GB2XHHM4884KEAR1': 'scenario-1',
  '25GB1EU8XXNPKSTAR4': 'scenario-2',
  '25GB0KTW9JPEMO5AR0': 'scenario-3',
  '25GB2A3YROMOM5XAR6': 'scenario-4',
  '25GB25XEV402TZBAR5': 'gms',
  '25GB3FJBV1UEKBDAR0': 'timeline/search-results-timeline',
  '25GBC64QCLFMUHPAR2': 'timeline/search-results-timeline',
  '25GBCLNTWCC1FN7ARO': 'timeline/search-results-cancel',
  '25GBBVWP03XACE8ARO': 'timeline/search-results-cancel',
  '25GB3HGVAICUT5YAR0': 'multiple-cheds-single-auth',
  '24GBDYHR49XV9BAFS1': 'filters-v4'
};

module.exports = (router) => {
  router.use((req, res, next) => {
    req.session.data = req.session.data || {};
    next();
  });

  router.use('/mvp/v5', (req, res, next) => {
    const seg = req.path.replace(/\/+$/, '').split('/').filter(Boolean)[0] || null;
    const allowed = new Set(['search', 'reporting', 'latest-activity', 'admin', 'user-guide']);
    res.locals.currentPage = allowed.has(seg) ? seg : null;
    next();
  });

  router.post('/mvp/v5/:page(search|search-news)/?', (req, res) => {
    const data = req.session.data;
    const search = (req.body['data.searchTerm'] || req.query.searchTerm || '').trim();

    const mrnPattern = /^24GB[A-Z0-9]{12}$/;
    const chedPattern = /^(CHED(P|PP)?\.GB\.\d{4}\.\d+|GBCHD\d{4}\.\d+)$/;
    const ducrPattern = /^[A-Z0-9]{1,35}-[A-Z0-9]{1,35}$/;
    const gmrPattern = /^[A-Z0-9]{18}$/;

    delete data.error;
    delete data.errorMessage;

    if (searchRedirects[search]) {
      data.searchTerm = search;
      data.title = search;
      return res.redirect(`/mvp/v5/${searchRedirects[search]}`);
    }

    if (!search) {
      data.error = 'true';
      data.errorMessage = 'Enter an MRN, CHED, GMR or DUCR reference';
      data.searchTerm = '';
      data.title = '';
    } else if (
      !mrnPattern.test(search) &&
      !chedPattern.test(search) &&
      !ducrPattern.test(search) &&
      !gmrPattern.test(search)
    ) {
      data.error = 'true';
      data.errorMessage = 'Enter an MRN, CHED, GMR or DUCR reference in the correct format';
      data.searchTerm = search;
      data.title = '';
    } else {
      data.error = 'true';
      data.errorMessage = `${search} cannot be found`;
      data.searchTerm = search;
      data.title = '';
    }

    return res.redirect('search');
  });

  router.post(['/mvp/v5/cookies/'], (req, res) => {
    const cookies = req.body.cookies;
    res.render('mvp/v5/cookies', { cookies });
  });

  router.post(['/mvp/v5/search-cookies/'], (req, res) => {
    const preference = req.body.cookies;
    if (preference === 'Yes' || preference === 'No') {
      res.cookie('cookiePreference', preference, {
        maxAge: 365 * 24 * 60 * 60 * 1000
      });
      return res.redirect('/mvp/v5/search-cookies?confirmation=true');
    }
    res.redirect('/mvp/v5/search-cookies');
  });

  router.get(['/mvp/v5/search-cookies/'], (req, res) => {
    const cookies = req.cookies.cookiePreference || '';
    const showConfirmation = req.query.confirmation === 'true';
    res.render('mvp/v5/search-cookies', {
      serviceName: 'Border Trade Matching Service',
      cookies,
      showConfirmation
    });
  });

  router.post(['/mvp/v5/sign-in-choose'], (req, res) => {
    const selected = req.body.signIn;
    if (selected === 'entra') {
      res.redirect('/mvp/v5/sign-in-entra');
    } else if (selected === 'gg') {
      res.redirect('/mvp/v5/sign-in-gg');
    } else {
      res.render('mvp/v5/sign-in-choose', {
        data: { signIn: '' },
        errorMessage: 'Select how you want to sign in'
      });
    }
  });

  router.post(['/mvp/v5/sign-out'], (req, res) => {
    const selected = req.body.signIn;
    if (selected === 'entra') {
      res.redirect('/mvp/v5/sign-in-entra');
    } else if (selected === 'gg') {
      res.redirect('/mvp/v5/sign-in-gg');
    } else {
      res.render('mvp/v5/sign-in-choose', {
        data: { signIn: '' },
        errorMessage: 'Select how you want to sign in'
      });
    }
  });

  const redirectPaths = _.uniq(Object.values(searchRedirects)).map(
    slug => `/mvp/v5/${slug}`
  );

  router.use(redirectPaths, (req, res, next) => {
    const q = (req.query.q || req.session.data?.searchTerm || '').trim();
    const sessionTitle = (req.session.data?.title || '').trim();
    const title = sessionTitle || (q ? q : '');
    if (title) {
      res.locals.title = title;
      res.locals.data = Object.assign({}, res.locals.data, {
        title,
        searchTerm: q
      });
    }
    next();
  });

  module.exports = router => {
    router.get('/new-layout-current', (req, res) => {
      const fallback = '25GB3FJBV1UEKBDAR0';
      const mrn = (req.query.mrn || req.session.data.title || req.session.data.mrn || fallback).trim();
      req.session.data.mrn = mrn;
      req.session.data.title = mrn;
      res.render('new-layout-current', { title: mrn });
    });
  };
};
