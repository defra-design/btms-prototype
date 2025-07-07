const { buildNunjucksEnvironment } = require('govuk-prototype-kit/lib/nunjucks');
const app = require('express')();

const nunjucksEnv = buildNunjucksEnvironment(app);
nunjucksEnv.addGlobal('govukRebrand', true);
