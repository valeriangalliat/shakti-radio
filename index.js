const SpotifyToYoutube = require('spotify-to-youtube')
const spotify = require('./spotify')
const youtube = require('./youtube')
const config = require('./config')
const { state, saveState } = require('./state')
const log = require('./log')

const spotifyToYoutube = SpotifyToYoutube(spotify.api)

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

async function main () {
  await spotify.authenticateApi()

  const current = await spotify.getCurrentlyPlaying()
  const track = current.track.uri
  log('Currently playing', current.track.artist.name, '-', current.track.name, `(${track})`)

  if (track === state.lastAddedTrack) {
    return
  }

  // Clear playlist on the first played track of the day.
  if (await isNewDay()) {
    log('New day, clearing Spotify playlist')
    await spotify.clearPlaylist()

    if (config.youtube) {
      log('Clearing YouTube playlist')
      await youtube.clearPlaylist()
    }
  }

  log('Adding to Spotify playlist')
  await spotify.addTrackToPlaylist(track)
  state.lastAddedTrack = track
  await saveState()

  if (config.youtube) {
    log('Adding to YouTube playlist')
    const youtubeTrack = await spotifyToYoutube(track, { raw: true })
    const youtubeArtist = 'artist' in youtubeTrack ? ('name' in youtubeTrack.artist ? youtubeTrack.artist.name : youtubeTrack.artist) : youtubeTrack.author
    log('[spotify-to-youtube]', 'Matched', current.track.artist.name, '-', current.track.name, `(${track}) with`, youtubeArtist, '-', youtubeTrack.name, `(${youtubeTrack.videoId})`)
    await youtube.addTrackToPlaylist(youtubeTrack.videoId)
  }
}

main()
  .catch(err => {
    console.error(err.stack || err)
    process.exit(1)
  })
