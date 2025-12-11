// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .pte and .bin files (required for ExecuTorch models)
config.resolver.assetExts.push('pte');
config.resolver.assetExts.push('bin');

module.exports = config;
