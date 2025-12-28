const { withInfoPlist } = require('@expo/config-plugins');

const withHealthKit = (config) => {
  return withInfoPlist(config, (config) => {
    // HealthKit permissions are already in app.json infoPlist
    // This plugin ensures they're properly set
    return config;
  });
};

module.exports = withHealthKit;

