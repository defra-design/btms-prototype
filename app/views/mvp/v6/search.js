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
  '25GBDD03IWJ3IHIAR1': 'timeline/search-results-latest',
  '25GBC64QCLFMUHPAR2': 'timeline/search-results-timeline',
  '25GBCLNTWCC1FN7AR0': 'timeline/search-results-cancel',
  '25GB3HGVAICUT5YAR0': 'multiple-cheds-single-auth',
  '24GBDYHR49XV9BAFS1': 'filters-v4',
  'GMRA00002TT2': 'timeline/gmr',
  'GMRA00002KW3': 'gmr-spain/gmr',
  '26GB16ICKGJAY5MAR4': 'vrn-search/watermelons-declaration-details',
  '25GBDJRJCC9G1PKAR0': 'vrn-search/flowers-declaration-details-tabs',
  '25GB4VN6T1XZ7B3Q5L': 'vrn-search/search-results-timeline',
  '25GBDD03IWJ3IHIAR1': 'vrn-search/search-results-timeline',
  'CHEDPP.GB.2026.7069665': 'vrn-search/search-results-timeline'
};

module.exports = (router) => {
  router.use((req, res, next) => {
    req.session.data = req.session.data || {};
    next();
  });

  router.use('/mvp/v6', (req, res, next) => {
    // req.path is relative to /mvp/v6, so /mvp/v6/search becomes /search
    const pathSegments = req.path.replace(/\/+$/, '').split('/').filter(Boolean);
    const seg = pathSegments[0] || null;
    const allowed = new Set(['search', 'reporting', 'latest-activity', 'admin', 'user-guide']);
    res.locals.currentPage = allowed.has(seg) ? seg : null;
    next();
  });

  router.post('/mvp/v6/:page(search|search-news)/?', (req, res) => {
    const data = req.session.data;
    const search = (req.body['data.searchTerm'] || req.query.searchTerm || '').trim();

    // VRN pattern: UK format (e.g., AB12 CDE, AB12CDE) or other formats
    const vrnPattern = /^[A-Z0-9]{1,8}(\s[A-Z0-9]{1,3})?$/i;
    // TRN pattern: alphanumeric, typically 6-12 characters
    const trnPattern = /^[A-Z0-9]{6,12}$/i;

    delete data.error;
    delete data.errorMessage;

    // Check for empty search
    if (!search) {
      data.error = 'true';
      data.errorMessage = 'Enter an MRN, CHED, GMR, VRN or TRN reference';
      data.searchTerm = '';
      data.title = '';
      return res.redirect('search');
    }

    // Check if search matches a redirect (known results)
    if (searchRedirects[search]) {
      data.searchTerm = search;
      data.title = search;
      return res.redirect(`/mvp/v6/${searchRedirects[search]}?q=${encodeURIComponent(search)}`);
    }

    // Handle TRN/VRN search - redirect to TRN/VRN results page
    if (vrnPattern.test(search) || trnPattern.test(search)) {
      data.searchTerm = search;
      data.title = search;
      return res.redirect('/mvp/v6/vrn-search/trn-vrn-results?q=' + encodeURIComponent(search));
    }

    // If no match found, show error
    data.error = 'true';
    data.errorMessage = `${search} cannot be found`;
    data.searchTerm = search;
    data.title = '';

    return res.redirect('search');
  });

  router.post(['/mvp/v6/cookies/'], (req, res) => {
    const cookies = req.body.cookies;
    res.render('mvp/v6/cookies', { cookies });
  });

  router.post(['/mvp/v6/search-cookies/'], (req, res) => {
    const preference = req.body.cookies;
    if (preference === 'Yes' || preference === 'No') {
      res.cookie('cookiePreference', preference, {
        maxAge: 365 * 24 * 60 * 60 * 1000
      });
      return res.redirect('/mvp/v6/search-cookies?confirmation=true');
    }
    res.redirect('/mvp/v6/search-cookies');
  });

  router.get(['/mvp/v6/search-cookies/'], (req, res) => {
    const cookies = req.cookies.cookiePreference || '';
    const showConfirmation = req.query.confirmation === 'true';
    res.render('mvp/v6/search-cookies', {
      serviceName: 'Border Trade Matching Service',
      cookies,
      showConfirmation
    });
  });

  router.post(['/mvp/v6/sign-in-choose'], (req, res) => {
    const selected = req.body.signIn;
    if (selected === 'entra') {
      res.redirect('/mvp/v6/sign-in-entra');
    } else if (selected === 'gg') {
      res.redirect('/mvp/v6/sign-in-gg');
    } else {
      res.render('mvp/v6/sign-in-choose', {
        data: { signIn: '' },
        errorMessage: 'Select how you want to sign in'
      });
    }
  });

  router.post(['/mvp/v6/sign-out'], (req, res) => {
    const selected = req.body.signIn;
    if (selected === 'entra') {
      res.redirect('/mvp/v6/sign-in-entra');
    } else if (selected === 'gg') {
      res.redirect('/mvp/v6/sign-in-gg');
    } else {
      res.render('mvp/v6/sign-in-choose', {
        data: { signIn: '' },
        errorMessage: 'Select how you want to sign in'
      });
    }
  });

  // GET: TRN/VRN results page (shows linked GMRs) - OLD URL redirect
  router.get('/mvp/v6/trn-vrn-results', (req, res) => {
    const q = (req.query.q || req.session.data?.searchTerm || '').trim();
    return res.redirect('/mvp/v6/vrn-search/trn-vrn-results?q=' + encodeURIComponent(q));
  });

  // GET: TRN/VRN results page (shows linked GMRs)
  router.get('/mvp/v6/vrn-search/trn-vrn-results', (req, res) => {
    const q = (req.query.q || req.session.data?.searchTerm || '').trim();
    
    req.session.data = req.session.data || {};
    req.session.data.searchTerm = q;
    req.session.data.title = q;
    
    res.render('mvp/v6/vrn-search/trn-vrn-results', {
      data: req.session.data
    });
  });

  // GET: GMR page in vrn-search folder
  router.get('/mvp/v6/vrn-search/gmr', (req, res) => {
    const gmr = req.query.gmr || req.session.data?.title || 'GMRA00002TT2';
    const q = (req.query.q || req.session.data?.searchTerm || gmr).trim();
    
    req.session.data = req.session.data || {};
    req.session.data.title = gmr;
    req.session.data.searchTerm = q;

    res.render('mvp/v6/vrn-search/gmr', {
      title: gmr,
      data: req.session.data
    });
  });

  // GET: MRN search results page in vrn-search folder
  router.get('/mvp/v6/vrn-search/watermelons-declaration-details', (req, res) => {
    const explicit = (req.query.mrn || req.query.q || '').trim();
    const mrn = explicit || '26GB16ICKGJAY5MAR4';

    req.session.data = req.session.data || {};
    req.session.data.title = mrn;
    req.session.data.searchTerm = mrn;
    req.session.data.Cds = req.session.data.Cds || 'Customs declaration details';
    req.session.data.Ipaffs = req.session.data.Ipaffs || 'IPAFFS notification (CHED) details';

    res.render('mvp/v6/vrn-search/watermelons-declaration-details', {
      title: mrn,
      data: req.session.data
    });
  });

  router.get('/mvp/v6/vrn-search/watermelons-declaration-details-tabs', (req, res) => {
    const explicit = (req.query.mrn || req.query.q || '').trim();
    const mrn = explicit || '26GB16ICKGJAY5MAR4';

    req.session.data = req.session.data || {};
    req.session.data.title = mrn;
    req.session.data.searchTerm = mrn;
    req.session.data.Cds = req.session.data.Cds || 'Customs declaration details';
    req.session.data.Ipaffs = req.session.data.Ipaffs || 'IPAFFS notification (CHED) details';

    res.render('mvp/v6/vrn-search/watermelons-declaration-details-tabs', {
      title: mrn,
      data: req.session.data
    });
  });

  router.get('/mvp/v6/vrn-search/watermelons-declaration-details-tabs-level-2', (req, res) => {
    const explicit = (req.query.mrn || req.query.q || '').trim();
    const mrn = explicit || '26GB16ICKGJAY5MAR4';

    req.session.data = req.session.data || {};
    req.session.data.title = mrn;
    req.session.data.searchTerm = mrn;
    req.session.data.Cds = req.session.data.Cds || 'Customs declaration details';
    req.session.data.Ipaffs = req.session.data.Ipaffs || 'IPAFFS notification (CHED) details';

    res.render('mvp/v6/vrn-search/watermelons-declaration-details-tabs-level-2', {
      title: mrn,
      data: req.session.data
    });
  });

  router.get('/mvp/v6/vrn-search/flowers-declaration-details-tabs', (req, res) => {
    const explicit = (req.query.mrn || req.query.q || '').trim();
    const mrn = explicit || '25GBDJRJCC9G1PKAR0';

    req.session.data = req.session.data || {};
    req.session.data.title = mrn;
    req.session.data.searchTerm = mrn;
    req.session.data.Cds = req.session.data.Cds || 'Customs declaration details';
    req.session.data.Ipaffs = req.session.data.Ipaffs || 'IPAFFS notification (CHED) details';

    res.render('mvp/v6/vrn-search/flowers-declaration-details-tabs', {
      title: mrn,
      data: req.session.data
    });
  });

  router.get('/mvp/v6/vrn-search/flowers-declaration-details-tabs-level-3', (req, res) => {
    const explicit = (req.query.mrn || req.query.q || '').trim();
    const mrn = explicit || '25GBDJRJCC9G1PKAR0';

    req.session.data = req.session.data || {};
    req.session.data.title = mrn;
    req.session.data.searchTerm = mrn;
    req.session.data.Cds = req.session.data.Cds || 'Customs declaration details';
    req.session.data.Ipaffs = req.session.data.Ipaffs || 'IPAFFS notification (CHED) details';

    res.render('mvp/v6/vrn-search/flowers-declaration-details-tabs-level-3', {
      title: mrn,
      data: req.session.data
    });
  });

  router.get('/mvp/v6/vrn-search/search-results-latest', (req, res) => {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(301, `/mvp/v6/vrn-search/watermelons-declaration-details${query}`);
  });

  router.get('/mvp/v6/vrn-search/search-results-timeline', (req, res) => {
    const mrn = req.query.mrn || req.query.q || req.session.data?.title || '25GB4VN6T1XZ7B3Q5L';
    
    req.session.data = req.session.data || {};
    req.session.data.title = mrn;
    req.session.data.searchTerm = mrn;
    req.session.data.Cds = req.session.data.Cds || 'Customs declaration details';
    req.session.data.Ipaffs = req.session.data.Ipaffs || 'IPAFFS notification (CHED) details';

    res.render('mvp/v6/vrn-search/search-results-timeline', {
      title: mrn,
      data: req.session.data
    });
  });

  // GET: TRN/VRN search results page (selection page)
  router.get('/mvp/v6/search-results-trn-vrn', (req, res) => {
    const q = (req.query.q || req.session.data?.searchTerm || '').trim();
    
    req.session.data = req.session.data || {};
    req.session.data.searchTerm = q;
    
    res.render('mvp/v6/search-results-trn-vrn', {
      data: req.session.data
    });
  });

  // POST: Handle selection on TRN/VRN search results page
  router.post('/mvp/v6/search-results-trn-vrn', (req, res) => {
    const data = req.session.data;
    const selectedItems = req.body.selectedItems;
    
    // Clear previous errors
    delete data.errors;
    delete data.errorList;
    
    // Validation: check if at least one item is selected
    if (!selectedItems || (Array.isArray(selectedItems) && selectedItems.length === 0)) {
      data.errors = {};
      data.errors.selectedItems = 'Select at least one item to continue';
      data.errorList = [
        {
          text: 'Select at least one item to continue',
          href: '#select-1'
        }
      ];
      return res.redirect('/mvp/v6/search-results-trn-vrn?q=' + encodeURIComponent(data.searchTerm || ''));
    }
    
    // Clear errors if validation passes
    delete data.errors;
    delete data.errorList;
    
    // Store selected items in session
    data.selectedItems = Array.isArray(selectedItems) ? selectedItems : [selectedItems];
    
    // For now, redirect to the first selected GMR
    // In a real implementation, this might go to a multi-select results page
    const firstSelected = Array.isArray(selectedItems) ? selectedItems[0] : selectedItems;
    
    // Check if it's a GMR and redirect accordingly
    if (firstSelected && firstSelected.startsWith('GMRA')) {
      return res.redirect(`/mvp/v6/vrn-search/gmr?gmr=${firstSelected}`);
    }
    
    // Default redirect
    return res.redirect('/mvp/v6/gmr-v1');
  });

  // GET: Plums declaration details page
  router.get('/mvp/v6/level-2/plums-declaration-details', (req, res) => {
    // Always prioritize query parameters - don't use session data for search term
    const q = (req.query.q || '').trim();
    
    req.session.data = req.session.data || {};
    
    // If query parameter exists, use it and clear any old searchTerm
    // Otherwise use session fallback, then default
    const searchTerm = q || (req.session.data?.searchTerm || '').trim() || '26GB150YG6RW3LRAR5';
    
    // Always update session with current values to keep it in sync
    req.session.data.searchTerm = searchTerm;
    req.session.data.title = searchTerm;
    req.session.data.Cds = req.session.data.Cds || 'Customs declaration details';
    req.session.data.Ipaffs = req.session.data.Ipaffs || 'IPAFFS notification (CHED) details';

    res.render('mvp/v6/level-2/plums-declaration-details', {
      title: searchTerm,
      data: req.session.data
    });
  });

  // GET: Strawberries declaration details page (timeline version)
  router.get('/mvp/v6/level-2/strawberries-declaration-details', (req, res) => {
    const q = (req.query.q || '').trim();
    
    req.session.data = req.session.data || {};
    const searchTerm = q || (req.session.data?.searchTerm || '').trim() || '25GB4VN6T1XZ7B3Q5L';
    
    req.session.data.searchTerm = searchTerm;
    req.session.data.title = searchTerm;
    req.session.data.Cds = req.session.data.Cds || 'Customs declaration details';
    req.session.data.Ipaffs = req.session.data.Ipaffs || 'IPAFFS notification (CHED) details';

    res.render('mvp/v6/level-2/strawberries-declaration-details', {
      title: searchTerm,
      data: req.session.data
    });
  });

  // GET: Watermelons declaration details page
  router.get('/mvp/v6/level-2/watermelons-declaration-details', (req, res) => {
    const q = (req.query.q || '').trim();
    
    req.session.data = req.session.data || {};
    const searchTerm = q || (req.session.data?.searchTerm || '').trim() || '26GB16ICKGJAY5MAR4';
    
    req.session.data.searchTerm = searchTerm;
    req.session.data.title = searchTerm;
    req.session.data.Cds = req.session.data.Cds || 'Customs declaration details';
    req.session.data.Ipaffs = req.session.data.Ipaffs || 'IPAFFS notification (CHED) details';

    res.render('mvp/v6/level-2/watermelons-declaration-details', {
      title: searchTerm,
      data: req.session.data
    });
  });

  // GET: Enhanced search results page with summary statistics and improved error visibility
  router.get('/mvp/v6/vrn-search/search-results-enhanced', (req, res) => {
    const q = (req.query.q || '').trim();
    
    req.session.data = req.session.data || {};
    const searchTerm = q || (req.session.data?.searchTerm || '').trim() || '25GB39TWY8009YRAR9';
    
    req.session.data.searchTerm = searchTerm;
    req.session.data.title = searchTerm;
    req.session.data.Cds = req.session.data.Cds || 'Customs declaration details';
    req.session.data.Ipaffs = req.session.data.Ipaffs || 'IPAFFS notification (CHED) details';

    res.render('mvp/v6/vrn-search/search-results-enhanced', {
      title: searchTerm,
      data: req.session.data
    });
  });

  const redirectPaths = _.uniq(Object.values(searchRedirects)).map(
    slug => `/mvp/v6/${slug}`
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
