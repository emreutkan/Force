const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add Storybook support
config.resolver.sourceExts.push('stories.tsx', 'stories.ts', 'stories.jsx', 'stories.js');

module.exports = config;



