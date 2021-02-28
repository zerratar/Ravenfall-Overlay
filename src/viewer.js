var states = {
  NONE: 0,
  TWITCH_AUTH_OK: 1,
  WAIT_FOR_GAME: 2,
  GAME_NOT_RUNNING: 3,
  AUTHENTICATING: 4,
  ANONYMOUS_USER: 5,
  NO_USER_ACCOUNT: 6,
  OK: 7,
};

const twitch = window.Twitch.ext;
window.console.log = twitch.rig.log;

var krakenUsersApi = 'https://api.twitch.tv/kraken/users/';
var ravenfallApiUrl = 'https://localhost:5001/api/';
// var ravenfallApiUrl = 'https://www.ravenfall.stream/api/';
var authApi = ravenfallApiUrl + 'auth';
var twitchApi = ravenfallApiUrl + 'twitch';
var extensionApi = twitchApi + '/extension';
var playersApi = ravenfallApiUrl + 'players';
var currentState = states.NONE;

class Requests {
  async getAsync(uri) {
    try {
      const data = await fetch(uri);
      return data.json();
    } catch {
      return null;
    }
  }
}

class TwitchService {
  constructor() {
    this.requests = new Requests();
    this.users = {};
  }
  async getTwitchUser(userId) {
    if (typeof this.users[userId] != undefined)
      return this.users[userId];
    return (this.users[userId] = await this.requests.getAsync(krakenUsersApi + '/' + userId));
  }
}
const twitchService = new TwitchService();

class RavenfallService {
  constructor() {
    this.isAuthenticated = false;
    this.twitchUserId = '';
    this.token = '';
    this.broadcasterId = '';
    this.sessionInfo = undefined;
    this.streamerInfo = undefined;
    this.requests = new Requests();
  }

  get isRavenfallAvailable() {
    return !!this.streamerInfo && this.streamerInfo.isRavenfallRunning;
  }

  setAuthInfo(broadcasterId, twitchUserId, token) {
    this.broadcasterId = broadcasterId;
    this.twitchUserId = twitchUserId;
    this.token = token;
  }

  async authenticateAsync() {
    if (this.isAuthenticated === true) {
      return;
    }

    onStateUpdated(states.AUTHENTICATING);
    this.sessionInfo = await this.requests.getAsync(extensionApi + '/' + this.broadcasterId + '/' + this.twitchUserId);
    this.isAuthenticated = !!this.sessionInfo;
  }

  async getStreamerSessionAsync() {
    onStateUpdated(states.WAIT_FOR_GAME);
    this.streamerInfo = await this.requests.getAsync(extensionApi + '/' + this.broadcasterId);
  }

  async createUserAsync(userName, displayName) {
    onStateUpdated(states.WAIT_FOR_GAME);
    this.sessionInfo = await this.requests.getAsync(extensionApi + '/new/' + this.broadcasterId + '/' + this.twitchUserId + '/' + userName + '/' + encodeURIComponent(displayName));
  }
} 
const ravenfall = new RavenfallService();


const onStreamerInfoUpdated = () => {
  const streamerInfo = JSON.stringify(ravenfall.streamerInfo);
  $('.twitch-user-id').html(streamerInfo);
  if (!ravenfall.isRavenfallAvailable) {
    onStateUpdated(states.GAME_NOT_RUNNING);
    const timeout = !!ravenfall.streamerInfo ? 5000 : 1500;
    setTimeout(() => ravenfall.getStreamerSessionAsync().then(() => onStreamerInfoUpdated()), timeout);
  }

  if (ravenfall.isRavenfallAvailable && ravenfall.isAuthenticated) {
    onStateUpdated(states.OK);
  } else if (!ravenfall.isAuthenticated) {
    ravenfall.authenticateAsync().then(() => onRavenfallAuth());
  }
};

const onRavenfallAuth = () => {
  if (ravenfall.sessionInfo == null) {
    // failed to authenticate    
    // user probably does not exist.
    // so we will try and get the twitch user info
    twitch.rig.log('Failed to authenticate with ravenfall. Most likely has no user.');
    if (!ravenfall.twitchUserId.toLowerCase().startsWith("u")) {
      onStateUpdated(states.ANONYMOUS_USER);
    } else {
      onStateUpdated(states.NO_USER_ACCOUNT);
    }
    return;
  }

  const sessionInfo = JSON.stringify(ravenfall.sessionInfo);
  twitch.rig.log('Authenticated with ravennest: ' + sessionInfo);
  const before = $('.twitch-user-id').html();
  $('.twitch-user-id').html(before + " " + sessionInfo);
  if (ravenfall.isRavenfallAvailable) {
    onStateUpdated(states.OK);
  }
};

const createNewUserAccount = () => {
  if (ravenfall.isAuthenticated) {
    return;
  }

  if (!ravenfall.twitchUserId.toLowerCase().startsWith("u")) {
    return;
  }

  twitchService.getTwitchUser(ravenfall.twitchUserId).then(user => {
    if (user && typeof user.name != undefined) {
      ravenfall.createUserAsync(user.name, user.display_name).then(() => onRavenfallAuth());
    }
  });
};

twitch.onContext(function (context) {
  twitch.rig.log(context);
});

twitch.onAuthorized(function (auth) {
  onStateUpdated(states.TWITCH_AUTH_OK);

  ravenfall.setAuthInfo(auth.channelId, auth.userId, auth.token);
  ravenfall.getStreamerSessionAsync().then(() => onStreamerInfoUpdated());
});

$(function () {
  // when we click the cycle button
  // $('#cycle').click(function () {
  // if(!token) { return twitch.rig.log('Not authorized'); }
  //   twitch.rig.log('Requesting a color cycle');
  //   // $.ajax(requests.set);
  // });
});

function onStateUpdated(newState) {
  currentState = newState;
  switch (currentState) {
    case states.OK:
      // everything is OK!
      // this is when the actual extension should be completely initialized.
      break;
    case states.TWITCH_AUTH_OK:
      // after recieving an OK from twitch.
      break;
    case states.AUTHENTICATING:
      // when authenticating with ravenfall website
      break;
    case states.WAIT_FOR_GAME:
    case states.GAME_NOT_RUNNING:
      // streamer does not have an active game session
      break;
    case states.ANONYMOUS_USER:
      // viewer has to accept extension permissions and share identity for this to work.
      break;
    case states.NO_USER_ACCOUNT:
      // User has no account. Ask them if they want to create one
      break;
  }
}