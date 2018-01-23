const chalk = require('chalk');
const composer = require('./updaters/composer');
const fs = require('fs');
const inquirer = require('inquirer');
const shelljs = require('shelljs');

module.exports = () => {
  require('./greeter')(`What projects do you want to update?`);

  const choices = fs.readdirSync('.')
    .filter(folder => fs.lstatSync(folder).isDirectory())
    .map(folder => ({ name: folder }));

  inquirer.prompt([{
    choices,
    type: 'checkbox',
    message: 'Select projects',
    name: 'projects',
    pageSize: 30,
  }]).then(({ projects }) => {
    if (!projects.length) {
      console.error(chalk.red('ERROR: You have selected no projects to update.'));
      return;
    }

    projects.forEach(project => {
      if (fs.existsSync(`${project}/composer.json`)) {
        shelljs.cd(project);

        const packageUpdates = composer.getOutdatedAfterUpdate()
          .split('\n')
          .map(composerPackage => {
            const [name, currentVersion, availableVersion] = composerPackage.split(/\s+/);

            return `${name} ${availableVersion}`;
          })
          .join(' ');

        shelljs.exec(`composer require ${packageUpdates} --no-update`, { silent: true });
        shelljs.exec('composer update', { silent: true });

        shelljs.cd('..');
      }
    });
  });
}
