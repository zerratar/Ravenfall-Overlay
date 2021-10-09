// var ravenfallApiUrl = 'https://localhost:5001/api/';
var ravenfallApiUrl = 'https://www.ravenfall.stream/api/';
var authApi = ravenfallApiUrl + 'auth';
var twitchApi = ravenfallApiUrl + 'twitch';
var extensionApi = twitchApi + '/extension';
var playersApi = ravenfallApiUrl + 'players';

export var ViewStates = {
  NONE: 'NONE',
  TWITCH_AUTH_OK: 'TWITCH_AUTH_OK',
  WAIT_FOR_GAME: 'WAIT_FOR_GAME',
  GAME_NOT_RUNNING: 'GAME_NOT_RUNNING',
  AUTHENTICATING: 'AUTHENTICATING',
  ANONYMOUS_USER: 'ANONYMOUS_USER',
  NO_USER_ACCOUNT: 'NO_USER_ACCOUNT',
  ALL_AUTH_OK: 'ALL_AUTH_OK',

  LOADING_CHARACTERS: 'LOADING_CHARACTERS',
  CHARACTERS_LOADED: 'CHARACTERS_LOADED',

  JOINING_GAME: 'JOINING_GAME',
  GAME_JOINED: 'GAME_JOINED',
  GAME_JOIN_FAILED: 'GAME_JOIN_FAILED',

  BAD_SERVER_CONNECTION: 'BAD_SERVER_CONNECTION'
};

export class RavenfallService {
    constructor(req, onStateChanged, onCharacterChanged) {
      this.requests = req;
      this.onCharacterChanged=onCharacterChanged;
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
  
    async authenticateAsync() {
      if (this.isAuthenticated === true) {
        return;
      }
  
      this.onStateChanged(ViewStates.AUTHENTICATING);
      this.sessionInfo = await this.requests.getAsync(extensionApi + '/' + this.broadcasterId + '/' + this.twitchUserId);
      this.isAuthenticated = !!this.sessionInfo;
      if (this.isAuthenticated) {
        this.requests.sessionId = this.sessionInfo.sessionId;
      }
    }
  
    async getStreamerSessionAsync() {
      if (this.requests.serverError == false && this.streamerInfo == null) {
        this.onStateChanged(ViewStates.WAIT_FOR_GAME);
      }
  
      this.streamerInfo = await this.requests.getAsync(extensionApi + '/' + this.broadcasterId);
    }
  
    async createUserAsync(userName, displayName) {
      this.onStateChanged(ViewStates.WAIT_FOR_GAME);
      this.sessionInfo = await this.requests.getAsync(extensionApi + '/new/' + this.broadcasterId + '/' + this.twitchUserId + '/' + userName + '/' + encodeURIComponent(displayName));
    }
  
    async getCharactersAsync() {
      this.onStateChanged(ViewStates.LOADING_CHARACTERS);
      this.characters = await this.requests.getAsync(playersApi + '/all');
      this.onStateChanged(ViewStates.CHARACTERS_LOADED);
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
      onTaskUpdated();
    }
  
    async leaveSessionAsync() {
      if (this.activeCharacter != null && await this.requests.getAsync(extensionApi + '/leave/' + this.broadcasterId + '/' + this.activeCharacter.id)) {
        this.characters = await this.requests.getAsync(playersApi + '/all');
      }
      this.activeCharacter = null;
      this.onStateChanged(ViewStates.CHARACTERS_LOADED);
    }
  
    async joinSessionAsync(character) {
      this.onStateChanged(ViewStates.JOINING_GAME);
      this.joinError = '';
      const characterJoinResult = await this.requests.getAsync(extensionApi + '/join/' + this.broadcasterId + '/' + character.id);
      if (characterJoinResult.success) {
        this.activeCharacter = characterJoinResult.player;
        this.onCharacterChanged(this.activeCharacter);
        this.onStateChanged(ViewStates.GAME_JOINED);
      } else {
        this.joinError = characterJoinResult.errorMessage;
        this.onStateChanged(ViewStates.GAME_JOIN_FAILED);
      }
    }
  }