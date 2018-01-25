const chalk = require('chalk');
const readlineSync = require('readline-sync');
const shelljs = require('shelljs');

module.exports = {
  getOutdatedAfterUpdate() {
    shelljs.cp('composer.lock', '.composer.lock');
    shelljs.exec('composer update', { silent: true });
    const stillOutdatedAfterUpdate = shelljs.exec('composer show -oD', { silent: true }).stdout.trim();
    shelljs.rm('composer.lock');
    shelljs.mv('.composer.lock', 'composer.lock');
    shelljs.exec('composer install', { silent: true });

    return stillOutdatedAfterUpdate;
  },
  update() {
    shelljs.exec('composer update', { silent: true })
  },
  url() {
    return process.env.WP_HOME;
  },
  used() {
    return !!this.url();
  },
  valid() {
    if (process.argv.includes('--yes')) {
      return true;
    }

    // Reset dependencies to current versions
    console.log(chalk.blue(`Re-installing dependencies based on ${chalk.bold('composer.lock')}..`));
    shelljs.exec('composer install', { silent: true });

    // Confirm dependency updates
    console.log(chalk.blue(`Testing if ${chalk.bold('composer.json')} has been updated properly..`));

    const stillOutdatedAfterUpdate = this.getOutdatedAfterUpdate();

    if (stillOutdatedAfterUpdate.length) {
      const packageCount = stillOutdatedAfterUpdate
        .split("\n")
        .length;

      console.log('');
      console.log(chalk.yellow(`WARNING: If I would continue updating, ${chalk.bold(packageCount)} packages would still not be up-to-date.`));
      console.log(chalk.dim(stillOutdatedAfterUpdate));
      const answer = readlineSync.question(chalk.yellow('Would you like me to continue? [Y/n] '));
      console.log('');
      
      if (answer.toLowerCase() === 'n') {
        return false;
      }
    }

    return true;
  },
}
