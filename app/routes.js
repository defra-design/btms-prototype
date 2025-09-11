//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here
require('./views/mvp/v1/search')(router)
require('./views/mvp/v2/search')(router)
require('./views/mvp/v3/search')(router)
require('./views/mvp/v4/search')(router)
require('./views/mvp/v4/reporting')(router)
require('./views/mvp/v5/search')(router)
