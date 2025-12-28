const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const withGoogleFit = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add Google Fit permissions
    if (!androidManifest.manifest.usesPermission) {
      androidManifest.manifest.usesPermission = [];
    }

    const permissions = [
      'android.permission.ACTIVITY_RECOGNITION',
      'android.permission.FITNESS_ACTIVITY_READ',
    ];

    permissions.forEach((permission) => {
      const hasPermission = androidManifest.manifest.usesPermission.some(
        (p) => p.$['android:name'] === permission
      );
      if (!hasPermission) {
        androidManifest.manifest.usesPermission.push({
          $: { 'android:name': permission },
        });
      }
    });

    return config;
  });
};

module.exports = withGoogleFit;

