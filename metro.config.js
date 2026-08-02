const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

// The Rails API lives at ./api in this monorepo. Metro watches the project root
// by default, so exclude it — there is nothing for Metro to bundle in there, and
// watching a Ruby tree (log/, tmp/, vendor/) slows startup and burns file handles.
const apiDir = path.resolve(__dirname, 'api');
const escapeForRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const existingBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : [config.resolver.blockList].filter(Boolean);

config.resolver.blockList = [
  ...existingBlockList,
  new RegExp(`^${escapeForRegExp(apiDir)}${escapeForRegExp(path.sep)}.*$`),
];

module.exports = withNativeWind(config, { input: './global.css' });
