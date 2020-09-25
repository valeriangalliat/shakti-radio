# Shakti Radio

> Live music from Shakti Rock Gym! 🧗‍♂️🎶💛

## Overview

Script to poll the unofficial Spotify friend activity API to see what's
currently playing at Shakti and automatically update a Spotify playlist.

You can listen to it [here][playlist]!

Also updates a mirror [YouTube playlist].

[playlist]: https://open.spotify.com/playlist/5qgFzOvllbtIehVfd66SZG
[YouTube playlist]: https://www.youtube.com/playlist?list=PL3gQ6-WYh7kX1CARbXnNuP4kgnG0E5Guu

The playlist is reset daily.

## Usage

Update `config.json` with your `spDcCookie` as documented [here][cookie]
as well as the `playlist` ID.

[cookie]: https://github.com/valeriangalliat/spotify-buddylist#sp_dc-cookie

Then you can run it in a cron job:

```crontab
* * * * * /path/to/shakti-radio/update
```

For the YouTube mirror, set your `clientId` and `clientSecret` in
`config.json` and run `node google-cli-auth` to get an OAuth token for
your account, that will be used to update the YouTube playlist.
