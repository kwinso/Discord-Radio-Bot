export default class MessageType {
    readonly color: string; // Color of Embed
    readonly emoji: string; // Emoji that goes after title

    constructor(emoji: string, color: string) {
        this.emoji = emoji;
        this.color = color;
    }
}