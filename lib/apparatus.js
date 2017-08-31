const chalk = require('chalk');
const composer = require('./updaters/composer');
const crawler = require('./crawler');
const greeter = require('./greeter');
const shelljs = require('shelljs');
const wp = require('./updaters/wp');

module.exports = () => {
  require('dotenv').config();

  const results = { start: '', end: '' };

  // Greet user
  greeter();

  // Determine updater to use
  let updater;

  if (composer.used()) {
    updater = composer;
    console.log(chalk.blue(`Using ${chalk.bold('Composer')} as dependency manager..`));
  } else if (wp.used()) {
    updater = wp;
    console.log(chalk.blue(`Using ${chalk.bold('WP-CLI')} for updating dependencies..`));
  }

  if (!updater) {
    console.error(chalk.red('ERROR: No valid WordPress environment found.'));
    return;
  }

  // Determine URL
  const url = updater.url();
  console.log(chalk.blue(`Determined your website's URL as: ${chalk.bold(url)}.`));

  // Validate updater
  if (!updater.valid()) {
    console.log(chalk.red('🤖  ABORTED UPDATE SEQUENCE.'));
    return;
  }

  // Start crawling
  console.log(chalk.blue(`Crawling ${chalk.bold(url)}..`));

  crawler(url).crawl()
    .then(directory => results.start = directory)
    .then(() => console.log(chalk.blue(`Updating dependencies..`)))
    .then(() => updater.update())
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
