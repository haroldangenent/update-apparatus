const crawler = require('./crawler');
const chalk = require('chalk');
const greeter = require('./greeter');
const readlineSync = require('readline-sync');
const shelljs = require('shelljs');

module.exports = () => {
  require('dotenv').config();

  const results = { start: '', end: '' };

  // Greet user
  greeter();

  // Determine URL
  const url = process.env.WP_HOME;

  if (!url) {
    console.error(chalk.red('ERROR: Environment variable WP_HOME not found.'));
    return;
  }

  console.log(chalk.blue(`${chalk.magenta('Aha!')} I have found your website's URL in your ${chalk.bold('.env')} file: ${chalk.bold(url)}.`));

  // Reset dependencies to current versions
  console.log(chalk.blue(`Re-installing dependencies based on ${chalk.bold('composer.lock')}..`));
  shelljs.exec('composer install', { silent: true });

  // Confirm dependency updates
  console.log(chalk.blue(`Testing if ${chalk.bold('composer.json')} has been updated properly..`));

  shelljs.cp('composer.lock', '.composer.lock');
  shelljs.exec('composer update', { silent: true });
  const stillOutdatedAfterUpdate = shelljs.exec('composer show -oD', { silent: true }).stdout.trim();
  shelljs.rm('composer.lock');
  shelljs.mv('.composer.lock', 'composer.lock');
  shelljs.exec('composer install', { silent: true });

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
      console.log(chalk.red('🤖  ABORTED UPDATE SEQUENCE.'));
      console.log('');
      return;
    }
  }  

  // Start crawling
  console.log(chalk.blue(`Crawling ${chalk.bold(url)}..`));

  crawler(url).crawl()
    .then(directory => results.start = directory)
    .then(() => console.log(chalk.blue(`Updating Composer dependencies..`)))
    .then(() => shelljs.exec('composer update', { silent: true }))
    .then(() => console.log(chalk.blue(`Re-crawling ${chalk.bold(url)}..`)))
    .then(() => crawler(url).crawl())
    .then(directory => results.end = directory)
    .then(() => {
      const fileName = 'updates.diff';

      shelljs.exec(`git diff --no-index ${results.start} ${results.end} > ${fileName}`, { silent: true });

      console.log('');
      console.log(chalk.green(`SUCCESS: Updates have been run. The output diff has been succesfully written out to ${chalk.bold(fileName)}.`));
    })
    .then(() => {
      shelljs.rm('-rf', results.start);
      shelljs.rm('-rf', results.end);

      console.log('');
      console.log(chalk.dim.italic(`${chalk.bold('UPDATE APPARATUS')} 🤖  thanks you for making him feel needed.`));
      console.log('');
    });
};
