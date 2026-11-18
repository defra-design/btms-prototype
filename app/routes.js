//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()




// Add your routes here

// Sign out (all versions): skip the separate "You are signed out" page and go straight to
// "How do you want to sign in?" with a "You are signed out" banner.
// Versions without their own sign-in page (v1 to v3) use v4's.
const signInChooseVersions = ['v4', 'v5', 'v6', 'v7-1', 'v7-2']
router.get(/^\/mvp\/([^/]+)\/(?:.*\/)?sign-out\/?$/, (req, res) => {
  // V7.3 to V7.5 are MRN pages only, so they share V7.2's sign in
  const requested = ['v7-3', 'v7-4', 'v7-5'].includes(req.params[0]) ? 'v7-2' : req.params[0]
  const version = signInChooseVersions.includes(requested) ? requested : 'v4'
  res.redirect('/mvp/' + version + '/sign-in-choose?signedOut=true')
})
router.get(/^\/mvp\/[^/]+\/sign-in-choose\/?$/, (req, res, next) => {
  res.locals.signedOut = req.query.signedOut === 'true'
  res.locals.greenBanner = req.query.banner === 'green' // compare the green version
  next()
})
require('./views/mvp/v1/search')(router)
require('./views/mvp/v2/search')(router)
require('./views/mvp/v3/search')(router)
require('./views/mvp/v4/search')(router)
require('./views/mvp/v4/reporting')(router)
require('./views/mvp/v5/search')(router)
require('./views/mvp/v5/reporting')(router)
require('./views/mvp/v5/admin/routes')(router)
require('./views/mvp/v5/timeline/routes')(router)
require('./views/mvp/v6/search')(router)
require('./views/mvp/v6/reporting')(router)
require('./views/mvp/v6/admin/routes')(router)
require('./views/mvp/v6/timeline/routes')(router)

router.use('/mvp/v7-1', (req, res, next) => {
  res.locals.prototypeVersion = 'v7-1'
  next()
})
require('./views/mvp/v7-1/search')(router)
require('./views/mvp/v7-1/reporting')(router)
require('./views/mvp/v7-1/admin/routes')(router)
require('./views/mvp/v7-1/timeline/routes')(router)

router.use('/mvp/v7-2', (req, res, next) => {
  res.locals.prototypeVersion = 'v7-2'
  next()
})
require('./views/mvp/v7-2/search')(router)
require('./views/mvp/v7-2/reporting')(router)
require('./views/mvp/v7-2/admin/routes')(router)
require('./views/mvp/v7-2/timeline/routes')(router)

// V7.3, V7.4 and V7.5: No match MRN pages only (V7.3 = version 2, V7.4 = version 3, V7.5 = labels and tooltips).
// The menu, search and timeline links use V7.2.
router.use(['/mvp/v7-3', '/mvp/v7-4', '/mvp/v7-5'], (req, res, next) => {
  res.locals.prototypeVersion = 'v7-2'
  next()
})
