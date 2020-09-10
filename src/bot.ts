import Discord from "discord.js";
import dotenv from "dotenv";

import CommandsManager from "./commands/CommandsManager";

dotenv.config();

const { token } = process.env;

if (process.env.prefix == undefined || process.env.prefix.length < 1) {
    console.log("[WARN] Prefix is not provided. Default prefix \"!r\" is in use.");
    process.env.prefix = "!r";
}

const client = new Discord.Client();
const commandsManager = new CommandsManager(process.env.prefix);



client.on('ready', () => {
    console.log(`Logged in as ${client.user?.username}!`);
});


client.on('message', async (msg: any) => {
    commandsManager.parse(msg);
});

client.login(token);