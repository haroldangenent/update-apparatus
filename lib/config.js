const fs = require('fs');

module.exports = () => {
  let config = {};

  try {
    config = JSON.parse(fs.readFileSync('.apparatusrc', 'utf-8'));
  } catch (err) {}

  return config;
}
