// var ravenfallApiUrl = 'https://localhost:5001/api/';
var ravenfallApiUrl = 'https://www.ravenfall.stream/api/';
var authApi = ravenfallApiUrl + 'auth';
var twitchApi = ravenfallApiUrl + 'twitch';
var extensionApi = twitchApi + '/extension';
var playersApi = ravenfallApiUrl + 'players';

export var ViewStates = {
  NONE: 'NONE',
  GAME_NOT_RUNNING: 'GAME_NOT_RUNNING',
  ANONYMOUS_USER: 'ANONYMOUS_USER',
  NO_USER_ACCOUNT: 'NO_USER_ACCOUNT',
  ALL_AUTH_OK: 'ALL_AUTH_OK',
  CHARACTER_SELECTION: 'CHARACTER_SELECTION',

  JOINING_GAME: 'JOINING_GAME',
  PLAYING: 'PLAYING',
  GAME_JOIN_FAILED: 'GAME_JOIN_FAILED',

  BAD_SERVER_CONNECTION: 'BAD_SERVER_CONNECTION'
};

export class RavenfallService {
  constructor(req, onStateChanged, onCharacterChanged) {
    this.requests = req;
    this.onCharacterChanged = onCharacterChanged;
    this.onStateChanged = onStateChanged;
    this.isAuthenticated = false;
    this.twitchUserId = '';
    this.token = '';
    this.broadcasterId = '';
    this.sessionInfo = undefined;
    this.streamerInfo = undefined;
    this.activeCharacter = undefined;
    this.joinError = ''
  }

  get isRavenfallAvailable() {
    return !!this.streamerInfo && this.streamerInfo.isRavenfallRunning;
  }

  setAuthInfo(broadcasterId, twitchUserId, token) {
    this.broadcasterId = broadcasterId;
    this.twitchUserId = twitchUserId;
    this.token = token;
  }

  trySetActiveCharacter() {
    let playSessions = this.sessionInfo.playSessions;    
    if (this.characters == null || this.characters.length == 0) {
      return false;
    }

    if (playSessions != null && playSessions.length > 0) {
      let inThisSession = [...playSessions.filter(x => x.sessionTwitchUserId == this.broadcasterId)];
      if (inThisSession.length > 0) {
        const character = this.characters.find(x => x.id == inThisSession[0].characterId);
        if (character != null && typeof character != undefined) {
          this.activeCharacter = character;
          this.onCharacterChanged(character);
          return true;
        }
      }
    }
    return false;
  }

  async authenticateAsync() {
    if (this.isAuthenticated === true) {
      return;
    }

    this.sessionInfo = await this.requests.getAsync(extensionApi + '/' + this.broadcasterId + '/' + this.twitchUserId);
    this.isAuthenticated = !!this.sessionInfo;
    if (this.isAuthenticated) {
      this.requests.sessionId = this.sessionInfo.sessionId;
      this.trySetActiveCharacter();      
    }
  }

  async getStreamerSessionAsync() {
    this.streamerInfo = await this.requests.getAsync(extensionApi + '/' + this.broadcasterId);
    return this.streamerInfo;
  }

  async createUserAsync(userName, displayName) {
    this.sessionInfo = await this.requests.getAsync(extensionApi + '/new/' + this.broadcasterId + '/' + this.twitchUserId + '/' + userName + '/' + encodeURIComponent(displayName));
    return this.sessionInfo;
  }

  async getCharactersAsync(forceReload = false) {
    console.log("getCharactersAsync");
    if (!forceReload && (this.characters != null && this.characters.length > 0)) {
      this.trySetActiveCharacter();
      return this.characters;
    }

    this.characters = await this.requests.getAsync(playersApi + '/all');
    if (!this.trySetActiveCharacter()) {
      this.onCharacterChanged(this.activeCharacter);
    }
    
    return this.characters;
  }

  async setTaskAsync(task, taskArgument) {
    if (this.activeCharacter == null || typeof this.activeCharacter == undefined) {
      return;
    }

    let taskData = task;
    if (taskArgument != null && taskArgument.length > 0) {
      taskData += '/' + taskArgument;
    }

    await this.requests.getAsync(extensionApi + '/set-task/' + this.broadcasterId + '/' + this.activeCharacter.id + '/' + taskData);
    this.activeCharacter.state.task = task;
    this.activeCharacter.state.taskArgument = taskArgument;
  }

  async leaveSessionAsync() {
    if (this.activeCharacter != null && await this.requests.getAsync(extensionApi + '/leave/' + this.broadcasterId + '/' + this.activeCharacter.id)) {
      this.characters = await this.requests.getAsync(playersApi + '/all');
    }
    this.activeCharacter = null;
    this.onCharacterChanged(null);
  }

  async joinSessionAsync(character) {
    this.onStateChanged(ViewStates.JOINING_GAME);
    this.joinError = '';
    const characterJoinResult = await this.requests.getAsync(extensionApi + '/join/' + this.broadcasterId + '/' + character.id);
    if (characterJoinResult.success) {
      this.activeCharacter = characterJoinResult.player;
      this.onCharacterChanged(this.activeCharacter);
      return this.activeCharacter;
    } else {
      this.joinError = characterJoinResult.errorMessage;
      this.onStateChanged(ViewStates.GAME_JOIN_FAILED);
      return null;
    }
  }
}