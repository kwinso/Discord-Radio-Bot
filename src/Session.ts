// * This class pepresents every channel where bot is playing now


// TODO: Error Handling
import { Guild, VoiceChannel, StreamDispatcher } from "discord.js";

export default class {
    public guildId: string;
    public readonly channel: VoiceChannel;
    private volume: number = 1;
    private stream!: StreamDispatcher;

    constructor(guild: string, channel: VoiceChannel) {
        this.guildId = guild;
        this.channel = channel;

        this.channel.join().then(connetion => {
            // @ts-ignore
            this.stream = connetion.play(process.env.live_file, { volume: this.volume });
        });
    }


    toggleMute() {
        if (!this.stream.paused) this.stream.pause();
        else this.stream.resume();
    }

    stop() {
        this.stream.end();
        this.channel.leave();
    }

    updateVolume(vol: number) {
        if (vol > 1) vol = 1;

        this.volume = vol;

        this.stream?.setVolume(this.volume);
    }
}