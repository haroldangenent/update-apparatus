const crawler = require('./crawler');
const chalk = require('chalk');
const greeter = require('./greeter');
const shelljs = require('shelljs');

module.exports = () => {
  require('dotenv').config();

  const url = process.env.WP_HOME;
  const results = { start: '', end: '' };

  greeter();

  if (!url) {
    console.error(chalk.red('ERROR: Environment variable WP_HOME not found.'));
    return;
  }

  console.log(chalk.blue(`Re-installing dependencies based on ${chalk.bold('composer.lock')}..`));
  shelljs.exec('composer install', { silent: true });

  console.log(chalk.blue(`Crawling ${chalk.bold(url)}..`));

  crawler(url).crawl()
    .then(directory => results.start = directory)
    .then(() => console.log(`Updating Composer dependencies..`))
    .then(() => shelljs.exec('composer update', { silent: true }))
    .then(() => console.log(`Re-crawling ${chalk.bold(url)}..`))
    .then(() => crawler(url).crawl())
    .then(directory => results.end = directory)
    .then(() => {
      const fileName = 'updates.diff';

      shelljs.exec(`git diff --no-index ${results.start} ${results.end} > ${fileName}`, { silent: true });

      console.log(chalk.green(`Updates have been run. The output diff has been succesfully written out to ${fileName}.`));
    })
    .then(() => {
      shelljs.rm('-rf', results.start);
      shelljs.rm('-rf', results.end);
    });
};
