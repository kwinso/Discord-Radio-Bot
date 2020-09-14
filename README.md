# Discord Radio Bot
Discord bot to stream radio in voice channel.


## Installation & Configuration
```bash
$ git clone https://github.com/uwumouse/Discord-Radio-Bot.git

$ cd DiscordRadioBot

$ npm install && npm run build
```

Then create `.env` file.  
Write this:
```
token="<discrod.bot.token>"
preifx="<!prefix_for_bot>"
# Url where you streaming your music
stream_url="http://mystream.com/stream"
# These 3 fields is optional
home_server="id of server where admin can see statistics"
home_channel="id of channel where admin will write command to see stats"
notifications_channel="id of channel where bot will be sending notifications about new songs"
```

## Start bot
```bash
$ node radio.build/bot.js
```