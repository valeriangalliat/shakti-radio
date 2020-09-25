const { google } = require('googleapis')
const config = require('./config')
const { state } = require('./state')

const oauth2Client = new google.auth.OAuth2(config.youtube.clientId, config.youtube.clientSecret, 'urn:ietf:wg:oauth:2.0:oob')

oauth2Client.setCredentials(state.youtubeToken)

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client
})

function addTrackToPlaylist (playlistId, videoId) {
  return new Promise((resolve, reject) => {
    youtube.playlistItems.insert({
      part: 'id,snippet',
      resource: {
        snippet: {
          playlistId,
          resourceId: {
            videoId,
            kind: 'youtube#video'
          }
        }
      }
    }, (err, data) => {
      if (err) {
        return reject(err)
      }

      resolve(data)
    })
  })
}

exports.addTrackToPlaylist = addTrackToPlaylist
