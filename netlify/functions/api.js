const { default: app } = require('../../dist/server');
const serverless = require('serverless-http');

module.exports.handler = serverless(app);
