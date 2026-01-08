const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const withGoogleFit = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add Google Fit permissions
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.ACTIVITY_RECOGNITION',
      'android.permission.INTERNET',
    ];

    permissions.forEach((permission) => {
      const hasPermission = androidManifest.manifest['uses-permission'].some(
        (p) => p.$['android:name'] === permission
      );
      if (!hasPermission) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    // Add fitness permissions to the <queries> tag for Android 11+
    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [{}];
    }
    
    if (!androidManifest.manifest.queries[0].package) {
      androidManifest.manifest.queries[0].package = [];
    }
    
    const packages = ['com.google.android.apps.fitness'];
    packages.forEach(pkg => {
        const hasPackage = androidManifest.manifest.queries[0].package.some(
            p => p.$ && p.$['android:name'] === pkg
        );
        if (!hasPackage) {
            androidManifest.manifest.queries[0].package.push({
                $: { 'android:name': pkg }
            });
        }
    });

    return config;
  });
};

module.exports = withGoogleFit;

