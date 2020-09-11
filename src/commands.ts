import { Message, MessageEmbed, Guild, EmbedField } from "discord.js";
import Session from "./session";
import c from "chalk";


class MessageType {
    readonly color: string; // Color of Embed
    readonly emoji: string; // Emoji that goes after title

    constructor(emoji: string, color: string) {
        this.emoji = emoji;
        this.color = color;
    }
}

class ServerStat {
    membersCount: number; // All members in given server
    membersListenning: number = 0; // Members are listenning to the bot
    region: string; // Region of a server 
    name: string; // Name of a server

    constructor(membersCount: number, region: string, name: string, membersListenning: number) {
        this.membersCount = membersCount;
        this.membersListenning = membersListenning;
        this.region = region;
        this.name = name;
    }
}

const DefaultMessageTypes =  {
    success: new MessageType("✅","#3BF23B"),

    warn: new MessageType("⚠️", "#FFFF00"),

    error: new MessageType("🔴", "#FF3356"),

    info: new MessageType("ℹ️", "#14AACC"),
}

interface CommandExitMessage {
    title: string; // Title of message
    text: string; // Main text
    type: MessageType; // Type, e.g success
    fields?: EmbedField[]; // Optional fields in messsage

} 

export default class {

    private prefix: string; // Prefix of commands that need to be processed by bot
    private errorPrefix: string = "[Commands Manager Error]"; // Prefix for error logs

    private sessions: Session[] = []; // Sessions of bot streams


    constructor(pref: string) {
        this.prefix = pref;
    }

    // Find session by GuildId 
    private findSession(guidId: string): Session | undefined {
        // @ts-ignore
        return this.sessions.find(s => s.guildId == guidId);
    }

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

            peopleListenning += peopleListenning;

            // Remove one member in 1st param since it's bot
            servers.push(new ServerStat(server.memberCount - 1, server.region, server.name, serverListenners));
        });
        
        return servers;
    }
    
    async executeWithArgs(args: string[], msg: Message, ): Promise<CommandExitMessage | CommandExitMessage[]> {

        if (!msg.member?.guild) {            
            return  {
                title: "Failed to join the chat.",
                text: "You have to be in chat before you can use the bot.",
                type: DefaultMessageTypes.error
            }
        }

        // TODO: Make help embed message
        switch (args[0]) {

            // Mute volume on bot
            case "mute":
            case "m": {
                let mutedSession = this.findSession(msg.member.guild.id);

                if (mutedSession == undefined) {
                    return  {
                        title: `No streams to mute.`,
                        text: "Radio Bot is not playing stream anywhere.",
                        type: DefaultMessageTypes.warn
                    }
                }
                mutedSession.updateVolume(0);
                
                return  {
                    title: `Muted in ${mutedSession.channel.name}`,
                    text: "Stream is muted!",
                    type: DefaultMessageTypes.success
                }
            }
            // Set volume
            case "vol": 
            case "volume":
            case "v": {
                let sessionToUpdate = this.findSession(msg.member.guild.id);

                if (sessionToUpdate == undefined) {
                    return {
                        title: `No stream to update volume!`,
                        text: "Bot is not playing anywhere.",
                        type: DefaultMessageTypes.warn
                    }
                }
                // Set to maximum
                if (args[1] == "max") {
                    sessionToUpdate.updateVolume(1);
                    return  {
                        title: `Volume set to max!`,
                        text: "Bot is playing music as loud as possible!",
                        type: DefaultMessageTypes.success
                    }
                }
                else {
                    let vol = parseFloat(args[1]);

                    //  Failed to parse volume number
                    if (Number.isNaN(vol)) {
                        return  {
                            title: `Use integers!`,
                            text: "Use 0-100 to set the volume.",
                            type: DefaultMessageTypes.error
                        }
                    }
                    // Converting from percents to float
                    vol = Math.abs(vol / 100);
                    
                    sessionToUpdate.updateVolume(vol);

                    return  {
                        title: `Volume is updated.`,
                        text: `Volume set to ${vol * 100}`,
                        type: DefaultMessageTypes.success
                    }
                }
            }
            // Leave the channel.
            case "leave": {
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
                            text: `Joined in channed ${createdSession.channel.name}.`,
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

                let homeServer = process.env.home_server;
                let homeChannel = process.env.home_channel;

                if (!homeChannel || !homeServer) {
                    return {
                        title: `Not configured.`,
                        text: `Please, specify ids of home server and home channel in configuration file to see stats.`,
                        type: DefaultMessageTypes.error 
                    }
                }

                if (msg.member.guild.id == homeServer && msg.channel.id == homeChannel) {

                    const stats = this.getStats(msg);

                    let totalMembersCount = 0;
                    let totalListenningCount = 0;
                    const serverFields: EmbedField[] = [];

                    for (let server of stats) {

                        totalMembersCount += server.membersCount;
                        totalListenningCount += server.membersListenning;

                        serverFields.push({
                            name: `Server: ${server.name}`,
                            value: `Region: ${server.region}\nMembers: ${server.membersCount}\nMembers listenning: ${server.membersListenning}\n`,
                            inline: false
                        });
                    }

                    let statsMessage: CommandExitMessage = {
                        title: "Stats Discovered!",
                        text: `Total servers amount: ${stats.length}\nTotal members amount: ${totalMembersCount}\nTotal members listenning: ${totalListenningCount}`,
                        type: DefaultMessageTypes.info,
                    }
                    
                    statsMessage.fields = serverFields;

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
            text:` Unknown command ${args[0]}\nUse \"${this.prefix} help\" to get help.`,
            type: DefaultMessageTypes.error
        }
        
    }


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