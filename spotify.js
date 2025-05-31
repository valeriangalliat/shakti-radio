const SpotifyWebApi = require('spotify-web-api-node')
const buddyList = require('spotify-buddylist')
const config = require('./config')
const { state, saveState } = require('./state')
const log = require('./log')

const api = new SpotifyWebApi()

async function clearPlaylist (batch = 0) {
  const tracksResponse = await api.getPlaylistTracks(config.spotify.playlist)
  const tracks = tracksResponse.body.items.map(item => ({ uri: item.track.uri }))

  log('Clearing playlist batch', batch, 'with', tracks.length, 'items')
  await api.removeTracksFromPlaylist(config.spotify.playlist, tracks)

  if (tracks.length === tracksResponse.body.limit) {
    return clearPlaylist(batch + 1)
  }
}

async function getCurrentlyPlayingImpl () {
  const activity = await buddyList.getFriendActivity(state.spotifyToken.accessToken)
  return activity.friends.find(friend => friend.user.name === config.spotify.friendName)
}

async function getCurrentlyPlaying () {
  try {
    return await getCurrentlyPlayingImpl()
  } catch (error) {
    log('Error getting currently playing', error)

    if (error.response?.status === 401) {
      delete state.spotifyToken
      await saveState()
      log('Refreshing token')
      await authenticateApi()
      return await getCurrentlyPlayingImpl()
    }

    throw error
  }
}

async function authenticateApi () {
  // No token or less than 1 minute left on token.
  if (!state.spotifyToken || state.spotifyToken.accessTokenExpirationTimestampMs < Date.now() + 1000 * 60) {
    log('Refreshing token')
    const tokenResponse = await buddyList.getWebAccessToken(config.spotify.spDcCookie)
    state.spotifyToken = tokenResponse
    await saveState()
  }

  api.setAccessToken(state.spotifyToken.accessToken)
}

function addTrackToPlaylist (track) {
  return api.addTracksToPlaylist(config.spotify.playlist, [track])
}

exports.api = api
exports.clearPlaylist = clearPlaylist
exports.getCurrentlyPlaying = getCurrentlyPlaying
exports.authenticateApi = authenticateApi
exports.addTrackToPlaylist = addTrackToPlaylist
