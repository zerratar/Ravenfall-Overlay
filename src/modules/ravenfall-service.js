import Requests from "./requests.js";
import WebSocketClient from "./websocket-client.js";

var authApi = ravenfallApiUrl + 'auth';
var twitchApi = ravenfallApiUrl + 'twitch';
var extensionApi = twitchApi + '/extension';
var playersApi = ravenfallApiUrl + 'players';

export default class RavenfallService {
  constructor(onCharacterChanged) {
    this.requests = new Requests();
    this.websocket = new WebSocketClient(ravenfallWebsocketApiUrl);
    this.onCharacterChanged = onCharacterChanged;
    this.sessionInfo = undefined;
    this.joinError = '';

    // this.websocket.subscribe('CharacterSkillUpdate', (data) => ...);
    // when ready: this.websocket.connectAsync();
    // the websocket connection will try to reconnect whenever disconnected.
    // this may need to be changed later
  }

  get isRavenfallAvailable() {

    if (Streamer.ravenfall.session.isActive) {
      return true;
    }

    return !!Streamer.ravenfall && Streamer.ravenfall.session.isActive;
  }  

  setAuthInfo(broadcasterId, twitchUserId, token) {
    Streamer.twitch.id = broadcasterId;
    Ravenfall.twitch.id = twitchUserId;
    Ravenfall.token = token;
    Streamer.updated = new Date();
    Ravenfall.updated = new Date();
    this.requests.setToken(token);
  }

  setCharacter(character) {
    if (character != null && typeof character != 'undefined') {
      Ravenfall.character = character;
      Ravenfall.updated = new Date();
      this.onCharacterChanged(character);
    } else {
      Ravenfall.character = null;
      this.onCharacterChanged(null);
    }
  }

  hasActiveCharacter() {
    if (Ravenfall.characterId == null) {
      return false;
    }

    return this.getActiveCharacter() != null;
  }

  getCharacterByPlaySession() {
    let playSessions = this.sessionInfo.playSessions;
    if (Ravenfall.characters == null || Ravenfall.characters.length == 0) {
      return null;
    }

    if (playSessions != null && playSessions.length > 0) {
      let inThisSession = [...playSessions.filter(x => x.sessionTwitchUserId == Streamer.twitch.id)];
      if (inThisSession.length > 0) {
        const character = Ravenfall.characters.find(x => x.id == inThisSession[0].characterId);
        if (character != null && typeof character != 'undefined') {
          return character;
        }
      }
    }
    return null;
  }

  // note(zerratar): this function updates the Ravenfall.character value
  // and therefor the onCharacterUpdate / onCharacterChanged / setCharacter must always
  // be called after a call to this one.
  getActiveCharacter() {
    const characters = Ravenfall.characters;
    const characterId = Ravenfall.characterId;
    if (characters == null || characters.length == 0 || characterId == null) {
      return null;
    }

    let character = Ravenfall.character;
    if (character == null || characterId != character.id) {
      Ravenfall.character = characters.find(x => x.id == characterId);
      character = Ravenfall.character;
      return character;
    }

    return character;
  }

  async updateActiveCharacterAsync() {
    try {      
      let activeCharacter = this.getActiveCharacter();
      if (activeCharacter == null) {
        this.setCharacter(null);
        return false;
      }

      // replace the existing character data with the one we get from the server
      activeCharacter = await this.requests.getAsync(extensionApi + '/player/' + Streamer.twitch.id);
      if (activeCharacter == null) {
        // if it isnt an error, then server is still up
        // say bye bye to the current character.
        if (this.requests.serverError === false) {
          this.setCharacter(null);
        }
        return false;
      }

      // if the ID's match. Which should be the case 99.9% of the time.
      // we will just replace the item in the array  as well as the current value
      // this will ensure that we don't accidently revert back to the old value if we use the character from the list.

      if (Ravenfall.characterId == activeCharacter.id) {
        let currentCharacterIndex = Ravenfall.characters.indexOf(Ravenfall.character);
        Ravenfall.characters[currentCharacterIndex] = activeCharacter;
      } else {
        // if the ID's do not match. we have to find the corresponding character of the new ID, or add that character to the list.
        const character = Ravenfall.characters.find(x => x.id == activeCharacter.id);
        if (character == null) {
          Ravenfall.characters.push(activeCharacter);
        } else {
          let currentCharacterIndex = Ravenfall.characters.indexOf(character);
          Ravenfall.characters[currentCharacterIndex] = activeCharacter;
        }
      }
      
      this.setCharacter(activeCharacter);
      return true;
    } catch (err) {
      console.error('Unable to update character at this moment: ' + err);
      return false;
    }
  }

  async authenticateAsync() {

    if (Ravenfall.isAuthenticated === true) {
      return;
    }

    this.sessionInfo = await this.requests.getAsync(extensionApi + '/' + Streamer.twitch.id + '/' + Ravenfall.twitch.id);
    Ravenfall.isAuthenticated = !!this.sessionInfo && this.sessionInfo.authenticated == true;
    Ravenfall.updated = new Date();

    if (Ravenfall.isAuthenticated) {
      this.requests.setSessionId(this.sessionInfo.sessionId);
      this.onCharacterChanged(this.getActiveCharacter());
    }
  }

  async getStreamerSessionAsync() {
    const streamerInfo = await this.requests.getAsync(extensionApi + '/' + Streamer.twitch.id);
    if (streamerInfo == null || typeof streamerInfo == 'undefined') {
      return null;
    }

    Ravenfall.characterId = streamerInfo.joinedCharacterId;
    Streamer.twitch.id = streamerInfo.streamerUserId;
    Streamer.twitch.username = streamerInfo.streamerUserName;

    Streamer.ravenfall.clientVersion = streamerInfo.clientVersion;
    Streamer.ravenfall.session.startedDateTime = streamerInfo.started;
    Streamer.ravenfall.session.id = streamerInfo.streamerSessionId;
    Streamer.ravenfall.session.playerCount = streamerInfo.playerCount;
    Streamer.ravenfall.session.isActive = streamerInfo.isRavenfallRunning;
    Streamer.updated = new Date();

    this.onCharacterChanged(this.getActiveCharacter());

    return Streamer;
  }

  async createUserAsync(userName, displayName) {
    this.sessionInfo = await this.requests.getAsync(extensionApi + '/new/' + Streamer.twitch.id + '/' + Ravenfall.twitch.id + '/' + userName + '/' + encodeURIComponent(displayName));
    Ravenfall.isAuthenticated = !!this.sessionInfo && this.sessionInfo.authenticated == true;
    if (Ravenfall.isAuthenticated) {
      this.requests.setSessionId(this.sessionInfo.sessionId);
      // this.trySetActiveCharacter();
      this.onCharacterChanged(this.getActiveCharacter());
    }
    return this.sessionInfo;
  }

  async getCharactersAsync(forceReload = false) {
    console.log("getCharactersAsync");
    if (!forceReload && (Ravenfall.characters != null && Ravenfall.length > 0)) {
      // this.trySetActiveCharacter();
      this.onCharacterChanged(this.getActiveCharacter());
      return Ravenfall.characters;
    }

    Ravenfall.characters = await this.requests.getAsync(playersApi + '/all');
    // this.trySetActiveCharacter();
    this.onCharacterChanged(this.getActiveCharacter());
    return Ravenfall.characters;
  }

  async setTaskAsync(task, taskArgument) {
    if (Ravenfall.character == null || typeof Ravenfall.character == 'undefined') {
      return;
    }

    let taskData = task;
    if (taskArgument != null && taskArgument.length > 0) {
      taskData += '/' + taskArgument;
    }

    await this.requests.getAsync(extensionApi + '/set-task/' + Streamer.twitch.id + '/' + Ravenfall.character.id + '/' + taskData);
    Ravenfall.character.state.task = task;
    Ravenfall.character.state.taskArgument = taskArgument;
  }

  async leaveSessionAsync() {
    if (Ravenfall.character != null && await this.requests.getAsync(extensionApi + '/leave/' + Streamer.twitch.id + '/' + Ravenfall.character.id)) {
      Ravenfall.characters = await this.requests.getAsync(playersApi + '/all');
    }

    Ravenfall.characterId = null;
    Ravenfall.character = null;
  }

  async joinSessionAsync(character) {
    this.joinError = '';
    let characterJoinResult = null;
    if (character == null || typeof character == 'undefined') {
      characterJoinResult = await this.requests.getAsync(extensionApi + '/create-join/' + Streamer.twitch.id);
    } else {
      characterJoinResult = await this.requests.getAsync(extensionApi + '/join/' + Streamer.twitch.id + '/' + character.id);
    }
    return characterJoinResult;

  }
}