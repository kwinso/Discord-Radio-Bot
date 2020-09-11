import Discord, { TextChannel } from "discord.js";
import dotenv from "dotenv";
import c from "chalk";

import Commands from "./commands";
import Notificator from "./notificator";

dotenv.config();

const { token } = process.env;

if (process.env.prefix == undefined || process.env.prefix.length < 1) {
    console.log(c.yellow("Prefix is not provided. Default prefix \"!r\" is in use."));
    process.env.prefix = "!r";
}

const client = new Discord.Client();
const commands = new Commands(process.env.prefix);
let notificator: Notificator;

client.on('ready', async () => {

    try {
        if (!process.env.stream_url) {
            console.log(`${c.red("Url to the stream not set.")}\nProvide \"stream_url\"\nExitting...`);
            process.exit();
        }
        if (process.env.home_server) {

            let homeServerName = await (await client.guilds.fetch(process.env.home_server)).name;

            console.log("Home server name: " + c.magenta(homeServerName));

            if (process.env.home_channel) {
                let homeChannel: TextChannel = client.channels.cache.get(process.env.home_channel) as TextChannel;
                console.log(`Home channel name: ${c.magenta(homeChannel.name)}`);

            } else {
                console.log(`Home channel name: ${c.red("Not Set.")} ("home_channel" to set)`);
            }
            if (process.env.notifications_channel) {
                let notificationsChannel: TextChannel = client.channels.cache.get(process.env.notifications_channel) as TextChannel;
        
                console.log(`Channel for notifications: ${c.magenta(notificationsChannel.name)}`);
        
                notificator = new Notificator(notificationsChannel);
            }
            else {
                console.log(`Channel for notifications: ${c.red("Not set.")} ("notifications_channel" to set)`)
            }
        } else {
            console.log(`${c.red("Home server not set.")}\nStatistics and notifications are off.`)
        }
        
    } catch (e) {
        console.log(c.red("Failed to gather info about channels. Is there any mistakes in your config?"));
    }
    
    
    if (notificator) notificator.watch();

    console.log(`${c.green(client.user?.tag + " stated.")}`);
});


client.on('message', async (msg: any) => {
    commands.parse(msg);
});

client.login(token);