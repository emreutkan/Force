const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

const withHealthKit = (config) => {
  // 1. Add Info.plist descriptions (already in app.json, but let's be safe)
  config = withInfoPlist(config, (config) => {
    config.modResults['NSHealthShareUsageDescription'] = 
      config.modResults['NSHealthShareUsageDescription'] || 
      'This app needs access to your step count to display your daily activity.';
    config.modResults['NSHealthUpdateUsageDescription'] = 
      config.modResults['NSHealthUpdateUsageDescription'] || 
      'This app needs access to update your health data.';
    return config;
  });

  // 2. Add HealthKit Entitlement (Crucial for iOS)
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.healthkit'] = true;
    config.modResults['com.apple.developer.healthkit.access'] = []; // Required for some versions
    return config;
  });

  return config;
};

module.exports = withHealthKit;

