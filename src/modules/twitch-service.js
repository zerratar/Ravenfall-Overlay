
import Requests from "./requests.js";

var gKrakenUsersApi = 'https://api.twitch.tv/kraken/users';

export default class TwitchService {
  constructor() {
    window.gLogic.twitch = this;
    this.requests = new Requests();
    this.requests.headers['Client-Id'] = '0kv9ifj1jzsknecetn555ftz3pxk88';
    this.requests.headers['Accept'] = 'application/vnd.twitchtv.v5+json';
    this.users = {};
  }
  async getTwitchUser(userId) {
    let user = this.users[userId];
    if (typeof user != 'undefined') {
      return this.users[userId];
    }
    
    user = await this.requests.getAsync(gKrakenUsersApi + '/' + userId);
    //TODO: Test for null - check for errors upon null

    return (this.users[userId] = user);
  }
}