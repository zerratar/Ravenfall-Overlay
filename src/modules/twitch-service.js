var krakenUsersApi = 'https://api.twitch.tv/kraken/users/';

export default class TwitchService {
    constructor(req) {
      this.requests = req;
      this.users = {};
    }
    async getTwitchUser(userId) {
      if (typeof this.users[userId] != undefined)
        return this.users[userId];
      return (this.users[userId] = await this.requests.getAsync(krakenUsersApi + '/' + userId));
    }
  }