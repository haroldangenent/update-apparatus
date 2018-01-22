#!/usr/bin/env node
if (process.argv.includes('--batch')) {
  require('./lib/batch.js')();
} else {
  require('./lib/apparatus.js')();
}
