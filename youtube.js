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

async function listPlaylist (tracks = [], nextPageToken) {
  const itemsResponse = await promisify(youtube.playlistItems, 'list', {
    part: 'id',
    playlistId: config.youtube.playlist,
    maxResults: 50,
    pageToken: nextPageToken
  })

  tracks.push(...itemsResponse.data.items.map(item => item.id))

  if (itemsResponse.data.nextPageToken) {
    return listPlaylist(tracks, itemsResponse.data.nextPageToken)
  }

  return tracks
}

async function clearPlaylist (batch = 0) {
  // For some reason you need to fetch the whole playlist at first, as
  // if you fetch just the first page and delete all songs from it, and
  // then fetch the first page of the playlist again, some deletions won't be
  // persisted just yet and that'll cause a conflict.
  const tracks = await listPlaylist()

  // Can't paralellize this for some weird reason, while it doesn't return
  // any error, only one track will be deleted.
  for (const id of tracks) {
    await promisify(youtube.playlistItems, 'delete', { id })
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
