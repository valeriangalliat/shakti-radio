const { google } = require('googleapis')
const readline = require('readline')
const config = require('./config')
const { state, saveState } = require('./state')

const oauth2Client = new google.auth.OAuth2(config.youtube.clientId, config.youtube.clientSecret, 'urn:ietf:wg:oauth:2.0:oob')

async function main () {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube']
  })

  console.log('Authorize this app by visiting this URL: ', authUrl)
  const code = await new Promise(resolve => rl.question('Enter the code from that page here: ', resolve))
  rl.close()

  const token = await new Promise((resolve, reject) => {
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        return reject(err)
      }

      resolve(token)
    })
  })

  state.youtubeToken = token
  saveState()
}

main()
  .catch(err => {
    console.error(err.stack || err)
    process.exit(1)
  })
