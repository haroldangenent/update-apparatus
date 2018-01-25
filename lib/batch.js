const chalk = require('chalk');
const composer = require('./updaters/composer');
const fs = require('fs');
const getConfig = require('./config');
const inquirer = require('inquirer');
const readlineSync = require('readline-sync');
const shelljs = require('shelljs');

module.exports = () => {
  require('./greeter')(`What projects do you want to update?`);

  const batchConfig = getConfig();
  const preferredProjects = batchConfig.projects || [];
  const choices = fs.readdirSync('.')
    .filter(folder => fs.lstatSync(folder).isDirectory())
    .map(folder => ({ name: folder, checked: preferredProjects.includes(folder) }));

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

    fs.writeFileSync('.apparatusrc', JSON.stringify({ projects }));

    const repositoryVersions = {};

    projects.forEach(project => {
      console.log(chalk.magenta(`Running update sequence for ${chalk.bold(project)}..`));
      console.log(chalk.blue(`Updating version constraints..`));

      shelljs.cd(project);

      if (fs.existsSync('composer.json')) {
        const config = getConfig();
        const skipPackages = config.batchSkip || [];
        const repositories = JSON.parse(shelljs.exec(`composer config repositories`, { silent: true }).stdout.trim());

        const updateRepositories = Object.keys(repositories)
          .map(key => repository = repositories[key])
          .filter(repository => repository.type === 'package')
          .filter(repository => !skipPackages.includes(repository.package.name))
          .map(repository => {
            const name = repository.package.name;
            const version = repositoryVersions[name] || readlineSync.question(chalk.yellow(`What version of ${chalk.bold(name)} would you like to install? (now: ${chalk.bold(repository.package.version)}) `))

            return { name, version };
          })
          .filter(repository => repository.version);

        if (updateRepositories.length) {
          const composerConfig = JSON.parse(fs.readFileSync('composer.json', 'utf-8'));
            
          updateRepositories.forEach(({ name, version }) => {
            repositoryVersions[name] = version;

            composerConfig.repositories.forEach(repository => {
              if (repository.type === 'package' && repository.package.name === name) {
                repository.package.version = version;

                if (repository.package.source) {
                  repository.package.source.reference = version;
                }
              }
            });
          });

          fs.writeFileSync('composer.json', JSON.stringify(composerConfig, null, 2));
        }

        const packageUpdates = composer.getOutdatedAfterUpdate()
          .split('\n')
          .map(composerPackage => composerPackage.split(/\s+/))
          .filter(([name]) => !skipPackages.includes(name))
          .map(([name, currentVersion, availableVersion]) => `${name} ${availableVersion}`)
          .join(' ');

        shelljs.exec(`composer require ${packageUpdates} --no-update`, { silent: true });
      }

      console.log(chalk.blue(`Running ${chalk.bold('UPDATE APPARATUS')}..`));
      shelljs.exec(`update-apparatus`, { silent: true });

      shelljs.cd('..');
    });

    console.log(chalk.green(`SUCCESS: Projects have been updated succesfully. Please review the pull request on each project.`));
  });
}
