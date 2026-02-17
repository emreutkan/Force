const appJson = require('./app.json');

// Load .env so RC_TEST_API (and others) are available
require('dotenv').config();

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      RC_TEST_API: process.env.RC_TEST_API,
    },
  },
};
