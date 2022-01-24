
import Requests from "./requests.js";

//var gKrakenUsersApi = 'https://api.twitch.tv/kraken/users'; - v5 (kraken) will be shut down in feb 2020

export default class TwitchService {
  constructor() {
    window.gLogic.twitch = this;
    //this.requests = new Requests();
    //this.requests.headers['Client-Id'] = '0kv9ifj1jzsknecetn555ftz3pxk88';
    //this.requests.headers['Accept'] = 'application/vnd.twitchtv.v5+json';
    //this.users = {};
  }

  processJWT(auth)
  {
    let opaque_id = auth.opaque_user_id;
    let twitch_id = auth.user_id;

    console.log("Twitch ID receieved from: " + twitch_id);
    //ProcessAuth and store
    window.gStreamer.twitch.id = auth.channel_id;
    window.gViewer.id = twitch_id;
    window.gViewer.opaque_id = opaque_id;
    window.gViewer.role = role;
    window.gViewer.is_unlinked = auth.is_unlinked;
    window.gViewer.updated = new Date(); 
    window.gStreamer.updated = new Date();
  }

  processViewerFromHelper(viewer)
  {
    if(viewer === null)
    {
      return;
    }
    window.gViewer.has_linked = viewer.isLinked;
    window.gViewer.updated = new Date(); 
  }

  async getTwitchUser(userId) {


    //let user = this.users[userId];
    //if (typeof user != 'undefined') {
      //return this.users[userId];
    //}
    
    //user = await this.requests.getAsync(gKrakenUsersApi + '/' + userId);
    //TODO: Test for null - check for errors upon null

    //return (this.users[userId] = user);
  }
}