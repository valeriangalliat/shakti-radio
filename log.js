function log (...args) {
  const localTime = new Date().toLocaleString('sv', { timeZone: 'America/Montreal' }).split(' ').pop()
  console.log(new Date().toISOString(), `[${localTime} EST]`, ...args)
}

module.exports = log
