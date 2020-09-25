const SpotifyWebApi = require('spotify-web-api-node')
const buddyList = require('spotify-buddylist')
const SpotifyToYoutube = require('spotify-to-youtube')
const youtube = require('./youtube')
const config = require('./config')
const { state, saveState } = require('./state')

const api = buddyList.wrapWebApi(new SpotifyWebApi({ spDcCookie: config.spotify.spDcCookie }))
const spotifyToYoutube = SpotifyToYoutube(api)

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
  const tracksResponse = await api.getPlaylistTracks(config.spotify.playlist)
  const tracks = tracksResponse.body.items.map(item => ({ uri: item.track.uri }))

  log('Clearing playlist batch', batch, 'with', tracks.length, 'items')
  await api.removeTracksFromPlaylist(config.spotify.playlist, tracks)

  if (tracks.length === tracksResponse.body.limit) {
    return clearPlaylist(batch + 1)
  }
}

async function getCurrentlyPlaying () {
  const activity = await api.getFriendActivity()
  return activity.body.friends.find(friend => friend.user.name === config.spotify.friendName)
}

async function authenticateApi () {
  // No token or less than 1 minute left on token.
  if (!state.spotifyToken || state.spotifyToken.accessTokenExpirationTimestampMs < Date.now() + 1000 * 60) {
    log('Refreshing token')
    const tokenResponse = await api.getWebAccessToken()
    state.spotifyToken = tokenResponse.body
    await saveState()
  }

  api.setAccessToken(state.spotifyToken.accessToken)
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

  log('Adding to Spotify playlist')
  await api.addTracksToPlaylist(config.spotify.playlist, [track])
  state.lastAddedTrack = track
  await saveState()

  log('Adding to YouTube playlist')
  const videoId = await spotifyToYoutube(track)
  await youtube.addTrackToPlaylist(config.youtube.playlist, videoId)
}

main()
  .catch(err => {
    console.error(err.stack || err)
    process.exit(1)
  })
