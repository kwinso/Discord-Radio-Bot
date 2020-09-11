import { EmbedField } from "discord.js";
import MessageType from "./messageType";

export default interface CommandExitMessage {
    title: string; // Title of message
    text: string; // Main text
    type: MessageType; // Type, e.g success
    fields?: EmbedField[]; // Optional fields in messsage

} 
