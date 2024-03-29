import Requests from "./requests.js";
import WebSocketClient from "./websocket-client.js";

export default class RavenfallService {
    constructor(onCharacterChanged) {
        Ravenfall.service = this;

        this.requests = new Requests();
        this.websocket = new WebSocketClient(ravenfallWebsocketApiUrl);

        this.onCharacterChanged = onCharacterChanged;
        this.sessionInfo = undefined;
        this.joinError = '';

        this.websocket.subscribe('StreamerInfo', data => this.onStreamerInfoUpdated(data));
        this.websocket.subscribe('PlayerRestedUpdate', data => this.onRestedUpdated(data));
        this.websocket.subscribe('CharacterExpUpdate', data => this.onExpUpdated(data));
        this.websocket.subscribe('PlayerRemove', data => this.onCharacterLeft(data));
        this.websocket.subscribe('PlayerAdd', data => this.onCharacterJoined(data));
        this.websocket.subscribe('CharacterStateUpdate', data => this.onCharacterStateUpdated(data));
        this.websocket.subscribe('GameStateRequest', data => this.onGameStateRequest(data));
        // when ready: this.websocket.connectAsync(); but can only 
        // be used after both setBroadcasterId and setSessionId has been called
    }
    onConnectionClosed(connectionClosedAction) {
        this.websocket.subscribe('close', data => connectionClosedAction(data));
    }

    onCharacterJoined(data) {
        Ravenfall.characterId = data.characterId;
        if (Ravenfall.isCharactersLoaded()) {
            console.log('We have joined the game!');
            let c = Ravenfall.characters.find(x => x.id == data.characterId);
            this.setCharacter(c);
        } else {
            console.warn('We have joined the game, but no characters have been loaded yet!!');
        }
    }

    onCharacterLeft(data) {
        if (data.characterId === Ravenfall.characterId) {
            Ravenfall.characterId = null;
            Ravenfall.character = null;

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

        /* 
            Ravenfall.characterId = streamerInfo.joinedCharacterId;
            Streamer.twitch.id = streamerInfo.streamerUserId;
            Streamer.twitch.username = streamerInfo.streamerUserName;
    	
            Streamer.ravenfall.clientVersion = streamerInfo.clientVersion;
            Streamer.ravenfall.session.startedDateTime = streamerInfo.started;
            Streamer.ravenfall.session.id = streamerInfo.streamerSessionId;
            Streamer.ravenfall.session.playerCount = streamerInfo.playerCount;
            Streamer.ravenfall.session.isActive = streamerInfo.isRavenfallRunning;
        */

        this.setStreamerSession(data);

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

        const character = Ravenfall.getCharacterById(data.characterId);
        if (character) {
            const skillName = Ravenfall.getSkillNameByIndex(data.skillIndex);
            character.skills[skillName + 'Level'] = data.level;
            character.skills[skillName] = data.experience;
        }

        // this.onCharacterChanged(character);
        console.log('Exp for active character updated.');

        if (Views.overview) {
            Views.overview.onExpUpdated(data);
        }

        if (Views.training) {
            Views.training.onExpUpdated(data);
        }
    }

    onGameStateRequest(data) {
        Ravenfall.gameState = { ...data };
        if (Views.overview) {
            Views.overview.onGameStateUpdated(data);
        }
    }

    onCharacterStateUpdated(data) {
        /*
            Guid CharacterId
            short Health
            Island Island
            CharacterState State
            int TrainingSkillIndex
            short X
            short Y
            short Z
        */

        const character = Ravenfall.getCharacterById(data.characterId);
        if (character) {
            character.state.island = island[data.island];
            character.state.destination = island[data.destination];
            character.state.x = data.x;
            character.state.y = data.y;
            character.state.z = data.z;
            character.state.health = data.health;
            character.state.expPerHour = data.expPerHour;
            character.state.estimatedTimeForLevelUp = data.estimatedTimeForLevelUp;
            character.state.inArena = false;
            character.state.inDungeon = false;
            character.state.joinedDungeon = false;
            character.state.inOnsen = false;
            character.state.inRaid = false;
            character.state.onFerry = character.state.island == null || character.state.island === island[0];
            character.state.isCaptain = data.isCaptain === true;
            switch (characterState[data.state]) {
                case "Raid": character.state.inRaid = true; break;
                case "Arena": character.state.inArena = true; break;
                case "JoinedDungeon": character.state.joinedDungeon = true; break;
                case "Dungeon": character.state.inDungeon = true; break;
                case "Onsen": character.state.inOnsen = true; break;
            }

            if (data.trainingSkillIndex == -1) {
                character.state.taskArgument = null;
                character.state.task = null;
            } else {
                character.state.taskArgument = Ravenfall.getSkillNameByIndex(data.trainingSkillIndex);
                if (Ravenfall.isCombatSkill(character.state.taskArgument)) {
                    character.state.task = "Fighting";
                } else {
                    character.state.task = character.state.taskArgument;
                }
            }

        }


        if (Views.islands != null) {
            Views.islands.onCharacterStateUpdated(character);
        }

        // console.log("onCharacterStateUpdated " + JSON.stringify(data));
    }

    onRestedUpdated(data) {
        /*
          the data looks like this:
          { 
            'expBoost': 'either 0 or 2', 
            'statsBoost': 'unused', 
            'restedPercent': '0..1', 
            'restedTime': 'seconds'
          }
        */

        const character = Ravenfall.getCharacterById(data.playerId);
        if (character) {
            character.state.restedTime = data.restedTime;
            character.state.restedUpdated = new Date();
        }

        if (Views.overview) {
            Views.overview.onRestedUpdated(character, data);
        }

        console.log('Rested for active character updated.');
    }

    get isRavenfallAvailable() {

        if (Streamer.ravenfall.session.isActive) {
            return true;
        }

        return !!Streamer.ravenfall && Streamer.ravenfall.session.isActive;
    }

    setContext(context) {
        Streamer.twitch.username = context.playerChannel;
    }

    setAuthInfo(auth) {
        // broadcasterId, twitchUserId, token
        // console.log(auth);

        Streamer.twitch.id = auth.channelId;

        Viewer.opaqueId = auth.userId;
        Viewer.helixToken = auth.helixToken;
        Viewer.token = auth.token;

        Viewer.isAnonymous = auth.userId[0] == 'A';

        if (window.Twitch.ext.viewer.isLinked) {
            Viewer.userId = window.Twitch.ext.viewer.id;
        }

        Ravenfall.token = auth.token;
        Ravenfall.helixToken = auth.helixToken;

        Streamer.updated = new Date();
        Ravenfall.updated = new Date();
        this.requests.setToken(auth.token);
        this.websocket.setBroadcasterId(auth.channelId);

        Viewer.service.tryResolveUser(auth);
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
            return true;
        }

        if (Streamer.twitch.id == null || Viewer.userId == null) {
            // we are not yet initialized with twitcch
            // console.error("Unable to authenticate with Ravenfall, missing broadcaster or viewer Twitch ID.");
            return false;
        }

        this.sessionInfo = await this.requests.getAsync(extensionApi + '/' + Streamer.twitch.id + '/' + Viewer.userId);
        Ravenfall.isAuthenticated = !!this.sessionInfo && this.sessionInfo.authenticated == true;
        Ravenfall.updated = new Date();

        if (Ravenfall.isAuthenticated) {
            this.requests.setSessionId(this.sessionInfo.sessionId);
            this.websocket.setSessionId(this.sessionInfo.sessionId);
            this.updateActiveCharacter();
            return Ravenfall.isAuthenticated === true;
        }

        return Ravenfall.isAuthenticated === true && this.requests.serverError == false;
    }

    updateActiveCharacter() {
        const lastActiveCharacter = Ravenfall.character;
        const activeCharacter = this.getActiveCharacter();
        if (lastActiveCharacter != activeCharacter && lastActiveCharacter == null) {
            this.onCharacterChanged(activeCharacter);
        }
    }

    async getStreamerSessionAsync() {
        const streamerInfo = await this.requests.getAsync(extensionApi + '/' + Streamer.twitch.id);
        if (streamerInfo == null || typeof streamerInfo == 'undefined') {
            return null;
        }

        return this.setStreamerSession(streamerInfo);
    }

    setStreamerSession(streamerInfo) {
        Ravenfall.characterId = streamerInfo.joinedCharacterId;

        if (streamerInfo.streamerUserId != null) {
            Streamer.twitch.id = streamerInfo.streamerUserId;
        }

        Streamer.twitch.username = streamerInfo.streamerUserName;

        Streamer.ravenfall.clientVersion = streamerInfo.clientVersion;
        Streamer.ravenfall.session.startedDateTime = streamerInfo.started;
        Streamer.ravenfall.session.id = streamerInfo.streamerSessionId;
        Streamer.ravenfall.session.playerCount = streamerInfo.playerCount;
        Streamer.ravenfall.session.isActive = streamerInfo.isRavenfallRunning;
        Streamer.updated = new Date();

        if (this.websocket.connected && !streamerInfo.isRavenfallRunning) {
            this.websocket.close(true);
        }

        this.updateActiveCharacter();

        return Streamer;
    }

    async createUserAsync(userName, displayName) {
        this.sessionInfo = await this.requests.getAsync(extensionApi + '/new/' + Streamer.twitch.id + '/' + Viewer.opaqueId + '/' + userName + '/' + encodeURIComponent(displayName));
        Ravenfall.isAuthenticated = !!this.sessionInfo && this.sessionInfo.authenticated == true;
        if (Ravenfall.isAuthenticated) {
            this.requests.setSessionId(this.sessionInfo.sessionId);
            // this.trySetActiveCharacter();      
            this.updateActiveCharacter();
        }
        return this.sessionInfo;
    }

    async getCharactersAsync(forceReload = false) {
        console.log("getCharactersAsync");
        if (!forceReload && (Ravenfall.characters != null && Ravenfall.length > 0)) {
            // this.trySetActiveCharacter();
            this.updateActiveCharacter();
            return Ravenfall.characters;
        }

        Ravenfall.characters = await this.requests.getAsync(playersApi + '/all');
        // this.trySetActiveCharacter();
        this.updateActiveCharacter();
        return Ravenfall.characters;
    }

    async loadItemsAsync() {
        if (Ravenfall.itemsLoaded == true) {
            return;
        }

        Ravenfall.items = await this.requests.getAsync(itemsApi);
        Ravenfall.itemsLoaded = true;

        console.log(Ravenfall.items.length + " items loaded!");
    }

    async enterOnsenAsync() {
        if (Ravenfall.character == null || typeof Ravenfall.character == 'undefined') {
            return;
        }
        Ravenfall.character.state.inOnsen = true;
        await this.requests.getAsync(extensionApi + '/enter-onsen/' + Streamer.twitch.id + '/' + Ravenfall.character.id);
    }

    async exitOnsenAsync() {
        if (Ravenfall.character == null || typeof Ravenfall.character == 'undefined') {
            return;
        }
        Ravenfall.character.state.inOnsen = false;
        await this.requests.getAsync(extensionApi + '/exit-onsen/' + Streamer.twitch.id + '/' + Ravenfall.character.id);

    }

    async joinRaidAsync() {
        if (Ravenfall.character == null || typeof Ravenfall.character == 'undefined') {
            return;
        }
        Ravenfall.character.state.inRaid = true;
        await this.requests.getAsync(extensionApi + '/join-raid/' + Streamer.twitch.id + '/' + Ravenfall.character.id);
    }

    async joinDungeonAsync() {
        if (Ravenfall.character == null || typeof Ravenfall.character == 'undefined') {
            return;
        }
        Ravenfall.character.state.joinedDungeon = true;
        await this.requests.getAsync(extensionApi + '/join-dungeon/' + Streamer.twitch.id + '/' + Ravenfall.character.id);
    }

    async startDungeonAsync() {
        if (Ravenfall.character == null || typeof Ravenfall.character == 'undefined') {
            return;
        }

        await this.requests.getAsync(extensionApi + '/start-dungeon/' + Streamer.twitch.id + '/' + Ravenfall.character.id);
    }

    async startRaidAsync() {
        if (Ravenfall.character == null || typeof Ravenfall.character == 'undefined') {
            return;
        }

        await this.requests.getAsync(extensionApi + '/start-raid/' + Streamer.twitch.id + '/' + Ravenfall.character.id);
    }

    async travelToIslandAsync(islandName) {
        if (Ravenfall.character == null || typeof Ravenfall.character == 'undefined') {
            return;
        }

        await this.requests.getAsync(extensionApi + '/travel/' + Streamer.twitch.id + '/' + Ravenfall.character.id + '/' + islandName);
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
        Ravenfall.character.state.destination = null;
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

        if (characterJoinResult && characterJoinResult.success) {
            this.setCharacter(characterJoinResult.player);
        }

        return characterJoinResult;

    }
}