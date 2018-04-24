# [![UPDATE APPARATUS](media/header.png)](https://github.com/haroldangenent/update-apparatus)

Running and testing WordPress updates is no fun. `UPDATE APPARATUS 🤖` will try and help you with this chore.

[![npm](https://badge.fury.io/js/update-apparatus.svg)](https://www.npmjs.com/package/update-apparatus)

## Update sequence
This is it's update sequence:

1. Validate dependencies
2. Crawl website
3. Update dependencies
4. Re-crawl website
5. Diff the output

![Update sequence.](media/preview.gif)

## Installation

```sh
npm install update-apparatus -g
```

## Usage
Run `update-apparatus` in the root of your project.

### Dependency management
`UPDATE APPARATUS 🤖` is able to either use [Composer](https://getcomposer.org/) and [wp-cli](https://github.com/wp-cli/wp-cli) for updating dependencies. `UPDATE APPARATUS 🤖` tries to be helpful and determines if it's a Composer-managed project based on a constant variable called `WP_HOME` that should exist in the `.env` file. This is used for determining the URL. It will tell you it's findings when running the update sequence.

## Configuration
You can configure your preferences per project through an `.apparatusrc` file that contains JSON.

```json
{
  "composerSkip": ["wpackagist-plugin/akismet"],
  "max": 1,
  "wpSkip": ["akismet"]
}
```

| Option | Description |
| :--- | :--- |
| `composerSkip` | Packages to skip when using `--batch` (see [Batch](#batch))
| `max` | Maximum amount of URLs to crawl
| `wpSkip` | Dependencies to skip when using `wp-cli` (used for [`wp plugin update --exclude`](https://developer.wordpress.org/cli/commands/plugin/update/))

## Batch
You can also run `UPDATE APPARATUS 🤖` to batch-update multiple projects. It will make some assumptions though. Use `update-apparatus --batch` in your projects root to use this. Workflow:

1. Assume projects are in subdirectories from the place you ran the command
2. You can select all projects you would like to update
3. Update version constraints to latest version for Composer packages and ask you about custom repositories
4. Run `UPDATE APPARATUS 🤖` for each project, without crawling the website
5. Commit changes in a branch
6. Create a pull request per project
7. Show links to PR's for you to review
