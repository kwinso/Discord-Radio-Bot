import { throws } from "assert";
// * This class pepresents every channel where bot is playing now

import { VoiceChannel, StreamDispatcher } from "discord.js";

// TODO: Error Handling
export default class {
    public guildId: string; // Id of server where stream is playing
    public readonly channel: VoiceChannel; // Channel where stream playing
    private volume: number = 0.75; // volume of stream
    private stream!: StreamDispatcher; // Stream instance

    private bitrate: number = Number(process.env.bitrate) || 64; // steam bitrate, default - 64 (if not provided in process.env)
    private plp: number = Number(process.env.plp) || 60; // stream package loss percentage, default - 60 (if no provided in process.env)

    constructor(guild: string, channel: VoiceChannel) {

        this.guildId = guild;
        this.channel = channel;

        this.channel.join().then(connetion => {
            // @ts-ignore
            this.stream = connetion.play(process.env.stream_url, { volume: this.volume });

            this.stream.setBitrate(this.bitrate);

            // Check if plp is beyond the maximum value (100%) 
            if (this.plp > 100) this.plp = 100;

            this.stream.setPLP(this.plp);
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