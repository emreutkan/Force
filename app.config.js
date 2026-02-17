const appJson = require('./app.json');

require('dotenv').config();

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      RC_API_KEY: process.env.RC_API_KEY,
    },
  },
};
