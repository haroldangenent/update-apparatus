const chalk = require('chalk');
const fs = require('fs');
const inquirer = require('inquirer');

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
  }]).then(projects => {
    if (!projects.length) {
      console.error(chalk.red('ERROR: You have selected no projects to update.'));
    }
  });
}
