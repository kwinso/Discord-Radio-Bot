import { Message, MessageEmbed, EmbedField } from "discord.js";
import Session from "./session";
import c from "chalk";
import ServerStat from "./types/serverStat";
import DefaultMessageTypes from "./types/defaultMessageTypes";
import CommandExitMessage from "./types/commandExitMessage";
import { commands } from "./help";


const helpMessage: CommandExitMessage = {
    type: DefaultMessageTypes.info,
    title: "Bot Help",
    text: "Bot for playing radio in voice chat.",
    fields: commands,
};

export default class {

    private prefix: string; // Prefix of commands that need to be processed by bot

    private sessions: Session[] = []; // Sessions of bot streams

    constructor(pref: string) {
        this.prefix = pref;
    }

    // Find session by GuildId 
    private findSession(guidId: string): Session | undefined {
        // @ts-ignore
        return this.sessions.find(s => s.guildId == guidId);
    }

    // Find session by guild id and stop it.
    private  stopSession(guildId: string): void {
        let sessionToStop = this.findSession(guildId);
        sessionToStop?.stop();
        // Remove session from sessions array
        this.sessions = this.sessions.filter(s => s.guildId != guildId);
    }

    private getStats(msg: Message): ServerStat[] {
        const servers: ServerStat[] = []; // Info about all servers
        let peopleListenning = 0; // All listenners on all servers


        msg.client.guilds.cache.map(server => {
            let serverListenners: number = 0; // Amount of listenners on this server

            // Find how many members is listenning to the bot on current server
            for (let session of this.sessions) {
                if (session.guildId == server.id) {
                    // Remove one listenner since it's bot itself
                    serverListenners = session.channel.members.size - 1; 
                }
            }
            peopleListenning += serverListenners;

            // Remove one member in 1st param since it's bot
            servers.push(new ServerStat(server.memberCount - 1, server.region, server.name, serverListenners));
        });
        
        return servers;
    }
    
    async executeWithArgs(args: string[], msg: Message, ): Promise<CommandExitMessage | CommandExitMessage[]> {

        // Exit if user is not in chat.
        if (!msg.member?.guild) {            
            return  {
                title: "Failed to join the chat.",
                text: "You have to be in server before you can use the bot.",
                type: DefaultMessageTypes.error
            }
        }

        // TODO: Make help embed message
        switch (args[0]) {

            case "help":
            case "h": {
                return helpMessage;
            }
            // Mute volume on bot
            case "mute":
            case "m": {
                let sessionToMute = this.findSession(msg.member.guild.id);

                if (!sessionToMute) {
                    return  {
                        title: `No streams to mute.`,
                        text: "Radio Bot is not playing stream anywhere.",
                        type: DefaultMessageTypes.warn
                    };
                }
                sessionToMute.updateVolume(0);
                
                return  {
                    title: `Muted in ${sessionToMute.channel.name}`,
                    text: "Stream is muted!",
                    type: DefaultMessageTypes.success
                };
            }
            // Set volume
            case "vol": 
            case "volume":
            case "v": {
                let session = this.findSession(msg.member.guild.id);

                if (!session) {
                    return {
                        title: `No stream to update volume!`,
                        text: "Bot is not playing anywhere.",
                        type: DefaultMessageTypes.warn
                    };
                }
                if (!args[1]) {
                    let vol = session.getVolume();
                    return {
                        title: `Volume: ${vol * 100}`,
                        text: `To change volume use "${this.prefix} vol <1-100>`,
                        type: DefaultMessageTypes.info
                    };
                }
                // Set to maximum
                if (args[1] == "max") {
                    session.updateVolume(1);
                    return  {
                        title: `Volume set to max!`,
                        text: "Bot is playing music as loud as possible!",
                        type: DefaultMessageTypes.success
                    };
                }
                else {
                    // Not numeric value provided
                    if (!RegExp(/^\d+$/).test(args[1])) {
                        return  {
                            title: `Use integers!`,
                            text: "Use 0-100 to set the volume.",
                            type: DefaultMessageTypes.error
                        }
                    }

                    let vol = parseInt(args[1]);

                    // Converting from percents to float
                    vol = Math.abs(vol / 100);
                    
                    session.updateVolume(vol);

                    let updated = vol > 1 ? "max" : vol * 100;

                    return  {
                        title: `Volume is updated.`,
                        text: `Volume set to ${updated}`,
                        type: DefaultMessageTypes.success
                    }
                }
            }
            // Leave the channel.
            case "leave":
            case "l": {
                this.stopSession(msg.member.guild.id);

                return  {
                    title: `Stopped.`,
                    text: `Bot is no longer streaming audio.`,
                    type: DefaultMessageTypes.success
                }
            }
            case "join": {

                // If member in voice chat
                if (msg.member?.voice.channel) {

                    if (this.findSession(msg.member.guild.id)?.channel.id == msg.member.voice.channel.id) {
                        return  {
                            title: `Already here.`,
                            text: `Bot already in channel you want to bot to join in.`,
                            type: DefaultMessageTypes.warn
                        }
                    }

                    try {
                        let createdSession = new Session(msg.member.guild.id, msg.member.voice.channel);
                        this.sessions.push(createdSession);

                        return {
                            title: `Joinded.`,
                            text: `Joined in channel ${createdSession.channel.name}.`,
                            type: DefaultMessageTypes.success
                        }
                    } catch (e) {
                        console.log(c.red(" Failed to created new stream session."));
                        console.log(e);

                        return  {
                            title: `Failed.`,
                            text: `Sorry, something went wrong and I can't access the channel.`,
                            type: DefaultMessageTypes.error
                        }
                    }

                } else {
                    return  {
                        title: `Join a voice chat.`,
                        text: `You have to be in a voice chat to invite bot.`,
                        type: DefaultMessageTypes.error
                    }
                } 
            }
            // Stats about servers and channels
            case "stat": {

                let homeServerId = process.env.home_server; 
                let homeChannelId = process.env.home_channel;

                if (!homeChannelId || !homeServerId) {
                    return {
                        title: `Not configured.`,
                        text: `Please, specify ids of home server and home channel in configuration file to see stats.`,
                        type: DefaultMessageTypes.error 
                    }
                }

                if (msg.member.guild.id == homeServerId && msg.channel.id == homeChannelId) {

                    const stats = this.getStats(msg);
                    const serverFields: EmbedField[] = []; // One field in embed message for each server

                    let totalMembersCount = 0;
                    let totalListenningCount = 0;

                    for (let server of stats) {

                        totalMembersCount += server.membersCount;
                        totalListenningCount += server.membersListenning;

                        serverFields.push({
                            name: `Server: ${server.name}`,
                            value: `Region: ${server.region}\n👨 Members: ${server.membersCount}\n🎧 Members listenning: ${server.membersListenning}\n`,
                            inline: false
                        });
                    }

                    let statsMessage: CommandExitMessage = {
                        title: "Stats Discovered!",
                        text: `Total servers amount: ${stats.length}\n👨 Total members amount: ${totalMembersCount}\n🎧 Total members listenning: ${totalListenningCount}`,
                        type: DefaultMessageTypes.info,
                        fields: serverFields
                    };
                    
                    return statsMessage;
                }
                else {
                    return {
                        title: `No permission.`,
                        text: `You cannot use this command (Make sure you're in right channel).`,
                        type: DefaultMessageTypes.error 
                    }
                }
            }
        }

        return  {
            title: `Unknown command.`,
            text:` Unknown command \"${args[0]}\"\nUse \"${this.prefix} help\" to get help.`,
            type: DefaultMessageTypes.error
        }
        
    }


    // Get command arguments from message
    parseArguments(command: string): string[] {

        // removing prefix for commands.
        command = command.substring(this.prefix.length).trim();

        return command.split(" ");
    }

    private generateEmbed(data: CommandExitMessage): MessageEmbed {
        let embed = new MessageEmbed({
            title: `${data.title} ${data.type.emoji}`,
            description: data.text,
        });

        if (data.fields) embed.fields = data.fields;

        embed.setColor(data.type.color);

        return embed;
    }

    // Create Embeds from exit messages
    private createEmbeds(data: CommandExitMessage[] | CommandExitMessage): MessageEmbed[] {

        let embeds: MessageEmbed[] = [];

        if (Array.isArray(data)) {
            for (let message of data) {
                embeds.push(this.generateEmbed(message));
            }
        }
        else {
            embeds.push(this.generateEmbed(data));
        }   

        return embeds;
    }

    // Check if message contains a command and try to execute this command.
    async parse(msg: Message): Promise<boolean> {

        let command = msg.content;

        if (command.startsWith(`${this.prefix} `)) {
            let args = this.parseArguments(command);
            let message = await this.executeWithArgs(args, msg);
            let embeds = this.createEmbeds(message);

            for (let embed of embeds) {
                msg.reply(embed);
            }
        }
        
        return false;
    }
}