const { default: defaultResolver } = require('jest-resolve');

module.exports = function (path, options) {
  if (
    /^(\.{1,2}\/.*)\.js$/.test(path) &&
    !options.basedir.includes('node_modules')
  ) {
    path = path.replace(/\.js$/, '.ts');
  }

  return defaultResolver(path, options);
};
