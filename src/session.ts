// * This class pepresents every channel where bot is playing now

import { VoiceChannel, StreamDispatcher } from "discord.js";

// TODO: Error Handling
export default class {
    public guildId: string;
    public readonly channel: VoiceChannel;
    private volume: number = 0.75;
    private stream!: StreamDispatcher;

    constructor(guild: string, channel: VoiceChannel) {
        this.guildId = guild;
        this.channel = channel;

        this.channel.join().then(connetion => {
            // @ts-ignore
            this.stream = connetion.play(process.env.stream_url, { volume: this.volume });
        });
    }

    stop() {
        try {
            this.stream.end();
            this.channel.leave();            
        } catch (e) {
            console.log("Error While Stopping the steam.");
            console.log(e);
        }
    }

    getVolume() { return this.volume };

    updateVolume(vol: number) {
        if (vol > 1) vol = 1;

        this.volume = vol;

        try {
            this.stream?.setVolume(this.volume);
        } catch (e) {
            console.log("Failed to set volume");
            console.log(e);
        }
    }
}