const { google } = require('googleapis')
const config = require('./config')
const { state } = require('./state')
const log = require('./log')

const oauth2Client = new google.auth.OAuth2(config.youtube.clientId, config.youtube.clientSecret, 'urn:ietf:wg:oauth:2.0:oob')

oauth2Client.setCredentials(state.youtubeToken)

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client
})

function promisify (object, method, params) {
  return new Promise((resolve, reject) => {
    object[method](params, (err, data) => {
      if (err) {
        return reject(err)
      }

      resolve(data)
    })
  })
}

async function clearPlaylist (batch = 0) {
  const itemsResponse = await promisify(youtube.playlistItems, 'list', {
    part: 'id',
    playlistId: config.youtube.playlist,
    maxResults: 50
  })

  const tracks = itemsResponse.data.items.map(item => item.id)

  log('Clearing playlist batch', batch, 'with', tracks.length, 'items')

  // Can't paralellize this for some weird reason.
  for (const id of tracks) {
    await promisify(youtube.playlistItems, 'delete', { id })
  }

  if (tracks.length === itemsResponse.data.pageInfo.resultsPerPage) {
    return clearPlaylist(batch + 1)
  }
}

function addTrackToPlaylist (videoId) {
  return promisify(youtube.playlistItems, 'insert', {
    part: 'id,snippet',
    resource: {
      snippet: {
        playlistId: config.youtube.playlist,
        resourceId: {
          videoId,
          kind: 'youtube#video'
        }
      }
    }
  })
}

exports.clearPlaylist = clearPlaylist
exports.addTrackToPlaylist = addTrackToPlaylist
