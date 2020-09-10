import { Message, MessageEmbed } from "discord.js";
import Session from "../Session";


class MessageType {
    color: string;
    emoji: string;

    constructor(emoji: string, color: string) {
        this.emoji = emoji;
        this.color = color;
    }
}

const DefaultMessageTypes =  {
    success: new MessageType("✅","#3BF23B"),

    warn: new MessageType("⚠️", "#FFFF00"),

    error: new MessageType("🔴", "#FF3356"),
}

interface CommandExitMessage {
    title: string;
    text: string;
    type: MessageType
} 

export default class {

    private prefix: string;
    private errorPrefix: string = "[Commands Manager Error]";

    private sessions: Session[] = [];


    constructor(pref: string) {
        this.prefix = pref;
    }

    private findSession(guidId: string): Session | undefined {
        // @ts-ignore
        return this.sessions.find(s => s.guildId == guidId);
    }

    private  stopSession(guildId: string): void {
        let sessionToStop = this.findSession(guildId);
        sessionToStop?.stop();
        // Remove session
        this.sessions = this.sessions.filter(s => s.guildId != guildId);
    }
    
    async executeWithArgs(args: string[], msg: Message, ): Promise<CommandExitMessage> {

        if (!msg.member?.guild) {            
            return  {
                title: "Failed to join the chat.",
                text: "You have to be in chat before you can use the bot.",
                type: DefaultMessageTypes.error
            }
        }

        // TODO: Make help embed message
        switch (args[0]) {

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
                if (args[1] == "max") {
                    sessionToUpdate.updateVolume(1);
                    return  {
                        title: `Volume set to max!`,
                        text: "Bot is playing music as loud as possible!",
                        type: DefaultMessageTypes.success
                    }
                }
                else {
                    let vol = parseInt(args[1]);

                    // Volume is not parsed
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
            case "leave": {
                this.stopSession(msg.member.guild.id);

                return  {
                    title: `Stopped.`,
                    text: `Bot is no longer streaming audio.`,
                    type: DefaultMessageTypes.success
                }
            }
            case "join": {
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
                        console.log(this.errorPrefix + " Failed to created new stream session.");
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


    private createEmbed(message: CommandExitMessage): MessageEmbed {

        let embed = new MessageEmbed({
            title: `${message.type.emoji} ${message.title}`,
            description: message.text,
        });
        embed.setColor(message.type.color);
        return embed;
    }

    async parse(msg: Message): Promise<boolean> {

        let command = msg.content;

        if (command.startsWith(`${this.prefix} `)) {
            let args = this.parseArguments(command);
            let message = await this.executeWithArgs(args, msg);
            let embed = this.createEmbed(message);
            msg.reply(embed);
        }
        
        return false;
    }
}