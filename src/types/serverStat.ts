export default class ServerStat {
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