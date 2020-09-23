# Shakti Radio

> Live music from Shakti Rock Gym! 🧗‍♂️🎶💛

## Overview

Script to poll the unofficial Spotify friend activity API to see what's
currently playing at Shakti and automatically update a Spotify playlist.

You can listen to it [here][playlist]!

[playlist]: https://open.spotify.com/playlist/5qgFzOvllbtIehVfd66SZG

The playlist is reset daily.

## Usage

Update `config.json` with your `spDcCookie` as documented [here][cookie]
as well as the `playlist` ID.

[cookie]: https://github.com/valeriangalliat/spotify-buddylist#sp_dc-cookie

Then you can run it in a cron job:

```crontab
* * * * * /path/to/shakti-radio/update
```
