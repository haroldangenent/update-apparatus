const chalk = require('chalk');
const shelljs = require('shelljs');

module.exports = {
  update() {
    // Core
    shelljs.exec('wp core update', { silent: true });

    // Plugins
    shelljs.exec('wp plugin update --all', { silent: true });

    // Translations
    shelljs.exec('wp core language update', { silent: true });
  },
  url() {
    return shelljs.exec('wp option get home', { silent: true }).stdout.trim();
  },
  used() {
    return !!this.url();
  },
  valid() {
    return true;
  },
}