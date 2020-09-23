const fs = require('fs').promises
const SpotifyWebApi = require('spotify-web-api-node')
const buddyList = require('spotify-buddylist')
const config = require('./config')
const state = require('./state')

const api = buddyList.wrapWebApi(new SpotifyWebApi({ spDcCookie: config.spDcCookie }))

function saveState () {
  return fs.writeFile(`${__dirname}/state.json`, JSON.stringify(state, null, 2) + '\n')
}

function log (...args) {
  const localTime = new Date().toLocaleString('sv', { timeZone: 'America/Montreal' }).split(' ').pop()
  console.log(new Date().toISOString(), `[${localTime} EST]`, ...args)
}

async function isNewDay () {
  const localHours = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Montreal' })).getHours()

  // In case there's some party msuic after midnight?
  if (localHours <= 5) {
    return false
  }

  const date = new Date().toLocaleString('sv', { timeZone: 'America/Montreal' }).split(' ').shift()

  if (date === state.date) {
    return false
  }

  state.date = date
  await saveState()
  return true
}

async function clearPlaylist (batch = 0) {
  const tracksResponse = await api.getPlaylistTracks(config.playlist)
  const tracks = tracksResponse.body.items.map(item => ({ uri: item.track.uri }))

  log('Clearing playlist batch', batch, 'with', tracks.length, 'items')
  await api.removeTracksFromPlaylist(config.playlist, tracks)

  if (tracks.length === tracksResponse.body.limit) {
    return clearPlaylist(batch + 1)
  }
}

async function getCurrentlyPlaying () {
  const activity = await api.getFriendActivity()
  return activity.body.friends.find(friend => friend.user.name === config.friendName)
}

async function authenticateApi () {
  // No token or less than 1 minute left on token.
  if (!state.token || state.token.accessTokenExpirationTimestampMs < Date.now() + 1000 * 60) {
    log('Refreshing token')
    const tokenResponse = await api.getWebAccessToken()
    state.token = tokenResponse.body
    await saveState()
  }

  api.setAccessToken(state.token.accessToken)
}

async function main () {
  await authenticateApi()

  const current = await getCurrentlyPlaying()
  const track = current.track.uri
  log('Currently playing', current.track.artist.name, '-', current.track.name, `(${track})`)

  if (track === state.lastAddedTrack) {
    return
  }

  // Clear playlist on the first played track of the day.
  if (await isNewDay()) {
    log('New day, clearing playlist')
    await clearPlaylist()
  }

  log('Adding to playlist')
  await api.addTracksToPlaylist(config.playlist, [track])
  state.lastAddedTrack = track
  await saveState()
}

main()
  .catch(err => {
    console.error(err.stack || err)
    process.exit(1)
  })
