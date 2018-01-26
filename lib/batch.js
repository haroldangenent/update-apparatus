const chalk = require('chalk');
const composer = require('./updaters/composer');
const fs = require('fs');
const getConfig = require('./config');
const inquirer = require('inquirer');
const readlineSync = require('readline-sync');
const rp = require('request-promise');
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

    let githubUser = shelljs.exec(`git config --global github.user`, { silent: true }).stdout.trim();
    let githubToken = shelljs.exec(`git config --global github.token`, { silent: true }).stdout.trim();

    if (!githubUser) {
      githubUser = readlineSync.question(chalk.yellow(`Please enter your GitHub username: `));
      shelljs.exec(`git config --global github.user ${githubUser}`, { silent: true });
    }

    if (!githubToken) {
      githubToken = readlineSync.question(chalk.yellow(`Please enter your GitHub access token: `), { hideEchoBack: true });
      shelljs.exec(`git config --global github.token ${githubToken}`, { silent: true });
    }

    const repositoryVersions = {};
    const pullRequests = [];

    projects.forEach(project => {
      console.log(chalk.magenta(`Running update sequence for ${chalk.bold(project)}..`));
      console.log(chalk.blue(`Updating version constraints..`));

      shelljs.cd(project);

      const branchName = `updates-${Date.now()}`;
      shelljs.exec(`git branch ${branchName} master`, { silent: true });
      shelljs.exec(`git checkout ${branchName}`, { silent: true });

      if (fs.existsSync('composer.json')) {
        const config = getConfig();
        const skipPackages = config.composerSkip || [];
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
      shelljs.exec(`${__dirname}/../index.js --yes`, { silent: true });

      const title = '⬆️ Update dependencies';
      const body = 'Auto-update by UPDATE APPARATUS 🤖';

      if (fs.existsSync('composer.json')) {
        shelljs.exec(`git commit composer.json composer.lock -m "${title}\n\n${body}"`, { silent: true });
      }

      shelljs.exec(`git push origin ${branchName}`, { silent: true });

      const repoUrl = shelljs.exec(`git config remote.origin.url`, { silent: true }).stdout.trim();
      const repoName = repoUrl.substr(repoUrl.lastIndexOf(':') + 1).replace('.git', '');

      pullRequests.push(rp({
        auth: {
          user: githubUser,
          pass: githubToken,
        },
        body: {
          base: 'master',
          body: '```' + body + '```',
          head: branchName,
          title,
        },
        headers: {
          'User-Agent': 'UPDATE APPARATUS',
        },
        json: true,
        method: 'POST',
        uri: `https://api.github.com/repos/${repoName}/pulls`,
      }));

      shelljs.cd('..');
    });

    Promise.all(pullRequests)
      .then(responses => {
        console.log(chalk.green(`SUCCESS: Projects have been updated succesfully. Please review the pull request for each project:`));

        responses.forEach(response => {
          console.log(chalk.dim(response.html_url));
        });
      });
  });
}
