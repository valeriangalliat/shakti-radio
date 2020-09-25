const fs = require('fs/promises')
const state = {}

try {
  Object.assign(state, require('./state.json'))
} catch (err) {
  // First run, ignore missing state.
}

function saveState () {
  return fs.writeFile(`${__dirname}/state.json`, JSON.stringify(state, null, 2) + '\n')
}

exports.state = state
exports.saveState = saveState
