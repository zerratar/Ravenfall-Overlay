import Requests from "./requests.js";

export default class TwitchService {
    constructor() {
        Viewer.service = this;
        this.requests = new Requests();
        this.requests.headers['Client-Id'] = '0kv9ifj1jzsknecetn555ftz3pxk88';
        this.requests.headers['Accept'] = 'application/vnd.twitchtv.v5+json';
        this.users = {};
    }

    tryResolveUser(auth) { }

    async getTwitchUser(userId) {
        let user = this.users[userId];

        if (typeof user != 'undefined') {
            return this.users[userId];
        }

        user = await this.requests.getAsync(krakenUsersApi + '/' + userId);

        return (this.users[userId] = user);
    }
}