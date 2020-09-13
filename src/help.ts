import { EmbedField } from "discord.js";

const commands: EmbedField[] =  [
    {
        "name": "help",
        "value": "Shows this message. 🆘",
        "inline": false
    },
    {
        "name": "volume",
        "value": 
            "Sets volume of playing stream. 🔉\nUsage: volume <1-100>\nAliases: v, vol, volume\nShortcuts: volume max - to set maximum volume 🔊.\nNote: To see current volume just type comamand without any parameters.",
        "inline": false
    },
    {
        "name": "join",
        "value": "Invites a bot in voice chat you're in. 🎶",
        "inline": false
    },
    {
        "name": "leave",
        "value": "Tells bot to stop the stream and leave a voice channel. ⛔\nAliases: leave, l",
        "inline": false
    },
    {
        "name": "mute",
        "value": 
            "Sets volume to 0. 🔇\nAliases: mute, m\n",
        "inline": false
    }
]

export { commands };