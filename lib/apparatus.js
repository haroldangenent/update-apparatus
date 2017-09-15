const chalk = require('chalk');
const composer = require('./updaters/composer');
const crawler = require('./crawler');
const fs = require('fs');
const greeter = require('./greeter');
const shelljs = require('shelljs');
const wp = require('./updaters/wp');

module.exports = () => {
  require('dotenv').config();

  const results = { start: '', end: '', crawled: [] };

  // Get config
  let config = {};

  try {
    config = JSON.parse(fs.readFileSync('.apparatusrc', 'utf-8'));    
  } catch (err) {}

  // Greet user
  greeter();

  // Determine updater to use
  let updater;

  if (composer.used()) {
    updater = composer;
    console.log(chalk.blue(`Using ${chalk.bold('Composer')} as dependency manager..`));
  } else if (wp.used()) {
    updater = wp;
    wp.setOptions({ skip: config.wpSkip });
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

  crawler(url, config.max).crawl()
    .then(({directory, crawled}) => {
      results.start = directory;
      results.crawled = crawled;
    })
    .then(() => console.log(chalk.blue(`Updating dependencies..`)))
    .then(() => updater.update())
    .then(() => console.log(chalk.blue(`Re-crawling ${chalk.bold(url)}..`)))
    .then(() => crawler(results.crawled).crawl())
    .then(({directory, crawled}) => results.end = directory)
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
