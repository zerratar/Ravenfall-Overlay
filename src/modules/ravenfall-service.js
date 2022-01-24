import Requests from "./requests.js";
import WebSocketClient from "./websocket-client.js";

export default class RavenfallService 
{
  constructor(onCharacterChanged) {
    window.gLogic.ravenfall = this;

    let ravenfallWebsocketApiUrl = window.gRavenfallUrl.rf_websocket_url;
    this.rfRequests = new Requests();
    this.websocket = new WebSocketClient(ravenfallWebsocketApiUrl);

    this.onCharacterChanged = onCharacterChanged;
    this.sessionInfo = undefined;
    this.joinError = '';


    this.websocket.subscribe('StreamerInfo', data => this.onStreamerInfoUpdated(data));
    this.websocket.subscribe('PlayerRestedUpdate', data => this.onRestedUpdated(data));
    this.websocket.subscribe('CharacterExpUpdate', data => this.onExpUpdated(data));
    this.websocket.subscribe('PlayerRemove', data => this.onCharacterLeft(data));
    this.websocket.subscribe('PlayerAdd', data => this.onCharacterJoined(data));
    // when ready: this.websocket.connectAsync(); but can only 
    // be used after both setBroadcasterId and setSessionId has been called
  }

  get isRavenfallAvailable() {
    
    if (window.gStreamer.streamer_ravenfall.session.isActive) {
      return true;
    }

    return !!window.gStreamer.streamer_ravenfall && window.gStreamer.streamer_ravenfall.session.isActive;
  }

  setAuthInfo() {
    if(window.gStreamer.twitch.id == null){
      return;
    }
      this.rfRequests.setToken(window.gViewer.token);
      this.websocket.setBroadcasterId(window.gStreamer.twitch.id);
  }

  setCharacter(character) {

    if (character != null && typeof character != 'undefined') {
      window.gRavenfallPlayer.character = character;
      window.gRavenfallPlayer.updated = new Date();
      this.onCharacterChanged(character);
    } else {
      window.gRavenfallPlayer.character = null;
      this.onCharacterChanged(null);
    }
  }

  hasActiveCharacter() {
    if (window.gRavenfall.characterId == null) {
      return false;
    }

    return this.getActiveCharacter() != null;
  }

  getCharacterByPlaySession() {
    let playSessions = this.sessionInfo.playSessions;
    if (window.gRavenfall.characters == null || window.gRavenfall.characters.length == 0) {
      return null;
    }

    if (playSessions != null && playSessions.length > 0) {
      let inThisSession = [...playSessions.filter(x => x.sessionTwitchUserId == window.gStreamer.twitch.id)];
      if (inThisSession.length > 0) {
        const character = window.gRavenfall.characters.find(x => x.id == inThisSession[0].characterId);
        if (character != null && typeof character != 'undefined') {
          return character;
        }
      }
    }
    return null;
  }

  // note(zerratar): this function updates the window.gRavenfall.character value
  // and therefor the onCharacterUpdate / onCharacterChanged / setCharacter must always
  // be called after a call to this one.
  getActiveCharacter() {
    const characters = window.gRavenfall.characters;
    const characterId = window.gRavenfall.characterId;
    if (characters == null || characters.length == 0 || characterId == null) {
      return null;
    }

    let character = window.gRavenfall.character;
    if (character == null || characterId != character.id) {
      window.gRavenfall.character = characters.find(x => x.id == characterId);
      character = window.gRavenfall.character;
      return character;
    }

    return character;
  }

  async updateActiveCharacterAsync() {
    let playersApi = window.rf.getObj("ravenfall").rf_api_player;
    try {
      let activeCharacter = this.getActiveCharacter();
      if (activeCharacter == null) {
        this.setCharacter(null);
        return false;
      }

      // replace the existing character data with the one we get from the server
      activeCharacter = await this.rfRequests.getAsync(playersApi + window.gStreamer.twitch.id);
      if (activeCharacter == null) {
        // if it isnt an error, then server is still up
        // say bye bye to the current character.
        if (this.rfRequests.serverError === false) {
          this.setCharacter(null);
        }
        return false;
      }

      // if the ID's match. Which should be the case 99.9% of the time.
      // we will just replace the item in the array  as well as the current value
      // this will ensure that we don't accidently revert back to the old value if we use the character from the list.

      if (window.gRavenfall.characterId == activeCharacter.id) {
        let currentCharacterIndex = window.gRavenfall.characters.indexOf(window.gRavenfall.character);
        window.gRavenfall.characters[currentCharacterIndex] = activeCharacter;
      } else {
        // if the ID's do not match. we have to find the corresponding character of the new ID, or add that character to the list.
        const character = window.gRavenfall.characters.find(x => x.id == activeCharacter.id);
        if (character == null) {
          window.gRavenfall.characters.push(activeCharacter);
        } else {
          let currentCharacterIndex = window.gRavenfall.characters.indexOf(character);
          window.gRavenfall.characters[currentCharacterIndex] = activeCharacter;
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
    let extensionApi = window.gRavenfallUrl.rf_api_twitch_extension;

    if (window.gLogic.isAuthenticated === true) {
      return true;
    }
    
    if(!window.gViewer.has_linked) {
      window.gLogic.isAuthenticated = false; // Can't authenticate with Ravenfal with an opaque id. 
      return false;
    }

    this.sessionInfo = await this.rfRequests.getAsync(extensionApi + '/' + window.gStreamer.twitch.id + '/' + window.gViewer.id);
    window.gLogic.isAuthenticated = !!this.sessionInfo && this.sessionInfo.authenticated == true;
    window.gLogic.updated = new Date();

    if (window.gLogic.isAuthenticated) {
      this.rfRequests.setSessionId(this.sessionInfo.sessionId);
      this.websocket.setSessionId(this.sessionInfo.sessionId);
      this.updateActiveCharacter();
      return window.gLogic.isAuthenticated === true;
    }

    return window.gRavenfall.isAuthenticated === true&&this.rfRequests.serverError == false;
  }

  updateActiveCharacter() {

    const lastActiveCharacter = window.gRavenfall.character;
    const activeCharacter = this.getActiveCharacter();
    if (lastActiveCharacter != activeCharacter && lastActiveCharacter == null) {
      this.onCharacterChanged(activeCharacter);
    }
  }

  async getStreamerSessionAsync() {
    let extensionApi = window.gRavenfallUrl.rf_api_twitch_extension;

    const streamerInfo = await this.rfRequests.getAsync(extensionApi + '/' + window.gStreamer.twitch.id);
    if (streamerInfo == null || typeof streamerInfo == 'undefined') {
      return null;
    }

    return this.setStreamerSession(streamerInfo);
  }

  setStreamerSession(streamerInfo) {
    window.gStreamer.streamer_ravenfall.characterId = streamerInfo.joinedCharacterId;
    window.gStreamer.twitch.id = streamerInfo.streamerUserId;
    window.gStreamer.twitch.username = streamerInfo.streamerUserName;

    window.gStreamer.streamer_ravenfall.clientVersion = streamerInfo.clientVersion;
    window.gStreamer.streamer_ravenfall.session.startedDateTime = streamerInfo.started;
    window.gStreamer.streamer_ravenfall.session.id = streamerInfo.streamerSessionId;
    window.gStreamer.streamer_ravenfall.session.playerCount = streamerInfo.playerCount;
    window.gStreamer.streamer_ravenfall.session.isActive = streamerInfo.isRavenfallRunning;
    window.gStreamer.updated = new Date();

    if (this.websocket.connected && !streamerInfo.isRavenfallRunning) {
      this.websocket.close(true);
    }

    this.updateActiveCharacter();

    return Streamer;
  }

  async createUserAsync(userName, displayName) {
    let extensionApi = window.rf.getObj("ravenfall").rf_api_twitch_extension;
    
    this.sessionInfo = await this.rfRequests.getAsync(extensionApi + '/new/' + window.gStreamer.twitch.id + '/' + window.gViewer.id + '/' + userName + '/' + encodeURIComponent(displayName));
    window.gRavenfall.isAuthenticated = !!this.sessionInfo && this.sessionInfo.authenticated == true;
    if (window.gRavenfall.isAuthenticated) {
      this.rfRequests.setSessionId(this.sessionInfo.sessionId);
      // this.trySetActiveCharacter();      
      this.updateActiveCharacter();
    }
    return this.sessionInfo;
  }

  async getCharactersAsync(forceReload = false) {
    let playersApi = window.rf.getObj("ravenfall").rf_api_player;
    

    console.log("getCharactersAsync");
    if (!forceReload && (window.gRavenfall.characters != null && window.gRavenfall.length > 0)) {
      // this.trySetActiveCharacter();
      this.updateActiveCharacter();
      return window.gRavenfall.characters;
    }

    window.gRavenfall.characters = await this.rfRequests.getAsync(playersApi + '/all');
    // this.trySetActiveCharacter();
    this.updateActiveCharacter();
    return window.gRavenfall.characters;
  }

  async setTaskAsync(task, taskArgument) {
    let extensionApi = window.rf.getObj("ravenfall").rf_api_twitch_extension;

    if (window.gRavenfall.character == null || typeof window.gRavenfall.character == 'undefined') {
      return;
    }

    let taskData = task;
    if (taskArgument != null && taskArgument.length > 0) {
      taskData += '/' + taskArgument;
    }

    await this.rfRequests.getAsync(extensionApi + '/set-task/' + window.gStreamer.twitch.id + '/' + window.gRavenfall.character.id + '/' + taskData);
    window.gRavenfall.character.state.task = task;
    window.gRavenfall.character.state.taskArgument = taskArgument;
  }

  async leaveSessionAsync() {
    let extensionApi = window.rf.getObj("ravenfall").rf_api_twitch_extension;
    let playersApi = window.rf.getObj("ravenfall").rf_api_player;

    if (window.gRavenfall.character != null && await this.rfRequests.getAsync(extensionApi + '/leave/' + window.gStreamer.twitch.id + '/' + window.gRavenfall.character.id)) {
      window.gRavenfall.characters = await this.rfRequests.getAsync(playersApi + '/all');
    }

    window.gRavenfall.characterId = null;
    window.gRavenfall.character = null;
  }

  async joinSessionAsync(character) {
    let extensionApi = window.rf.getObj("ravenfall").rf_api_twitch_extension;

    this.joinError = '';
    let characterJoinResult = null;
    if (character == null || typeof character == 'undefined') {
      characterJoinResult = await this.rfRequests.getAsync(extensionApi + '/create-join/' + window.gStreamer.twitch.id);
    } else {
      characterJoinResult = await this.rfRequests.getAsync(extensionApi + '/join/' + window.gStreamer.twitch.id + '/' + character.id);
    }

    if (characterJoinResult && characterJoinResult.success) {
      this.setCharacter(characterJoinResult.player);
    }

    return characterJoinResult;

  }
  
/*
 * 
 * ///WEBSOCKET EVENTS////
 *
*/
  onConnectionClosed(connectionClosedAction) {
    this.websocket.subscribe('close', data => connectionClosedAction(data));
  }

  onCharacterJoined(data) {

    window.gRavenfall.characterId = data.characterId;
    if (window.gRavenfall.isCharactersLoaded()) {
      console.log('We have joined the game!');
      this.onCharacterChanged(window.gRavenfall.characters.find(x => x.id == data.characterId));      
    } else {
      console.warn('We have joined the game, but no characters have been loaded yet!!');
    }    
  }

  onCharacterLeft(data) {

    if (data.characterId === window.gwindow.gRavenfall.characterId) {
      this.onCharacterChanged(null);
      console.log('We have left the game!');
    } else {
      console.warn('We have received a player remove but not for our player? :o');
    }
  }
  onStreamerInfoUpdated(data) {
    /*
      the data looks like this:
        'streamerUserId': number,
        'streamerUserName: 'string|null',
        'streamerSessionId': 'string|null',
        'isRavenfallRunning': 'boolean',
        'playerCount': number
        'started': 'string|date|null',
        'clientVersion': 'string|null',
        'joinedCharacterId': 'guid|string|null'
    */
    // this.setStreamerSession(data);
    //this.websocket.close();
    console.log("Streamer Session Info updated via ws: " + data);
  }

  onExpUpdated(data) {
    /*
     the data looks like this:
     { 
       'characterId': 'guid', 
       'skillIndex': 'which skill by index', 
       'level': 'new skill level',
       'experience': 'new skill experience'
     }
   */
    // console.log(data);
    console.log('Exp for active character updated.');
  }

  onRestedUpdated(data) {
    /*
      the data looks like this:
      { 
        'characterId': 'guid', 
        'expBoost': 'either 0 or 2', 
        'statsBoost': 'unused', 
        'restedPercent': '0..1', 
        'restedTime': 'seconds' 
      }

      and can be used by:

      if (data.restedTime > 0) {
        display('You still have ' + data.restedTime + ' seconds of being rested.');
      }
    */
    // console.log(data);
    console.log('Rested for active character updated.');
  }
}