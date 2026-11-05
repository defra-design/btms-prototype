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
const signInChooseVersions = ['v4', 'v5', 'v6', 'v7', 'v7-2']
router.get(/^\/mvp\/([^/]+)\/(?:.*\/)?sign-out\/?$/, (req, res) => {
  const version = signInChooseVersions.includes(req.params[0]) ? req.params[0] : 'v4'
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

router.use('/mvp/v7', (req, res, next) => {
  res.locals.prototypeVersion = 'v7'
  next()
})
require('./views/mvp/v7/search')(router)
require('./views/mvp/v7/reporting')(router)
require('./views/mvp/v7/admin/routes')(router)
require('./views/mvp/v7/timeline/routes')(router)

router.use('/mvp/v7-2', (req, res, next) => {
  res.locals.prototypeVersion = 'v7-2'
  next()
})
require('./views/mvp/v7-2/search')(router)
require('./views/mvp/v7-2/reporting')(router)
require('./views/mvp/v7-2/admin/routes')(router)
require('./views/mvp/v7-2/timeline/routes')(router)
