var maximum_allowed_characters = 3; // change this if we want to introduce a 4th or 5th character
// changing maximum: see PlayerManager.cs:27, RavenNest.BusinessLogic Kappa


//define default values
// var ravenfallApiUrl = 'https://localhost:5001/api/';
// var ravenfallWebsocketApiUrl = 'wss://localhost:5001/api/stream/extension';
var ravenfallApiUrl = 'https://www.ravenfall.stream/api/';
var ravenfallWebsocketApiUrl = 'wss://www.ravenfall.stream/api/stream/extension';

// SET __NO_DEVELOPER_RIG__ = true; if NOT using the twitch developer rig
var __NO_DEVELOPER_RIG__ = false;

var __streamer_twitch_username = 'abbycottontail';
var __streamer_twitch_id = '39575045';
var __your_twitch_username = 'abbycottontail';
var __your_twitch_id = '39575045';

// var __streamer_twitch_username = 'zerratar';
// var __streamer_twitch_id = '72424639';
// var __your_twitch_username = 'zerratar';
// var __your_twitch_id = '72424639';

var skillNames = [
    'attack',
    'defense',
    'strength',
    'health',
    'magic',
    'ranged',
    'woodcutting',
    'fishing',
    'mining',
    'crafting',
    'cooking',
    'farming',
    'slayer',
    'sailing',
    'healing'
];

var Twitch = {
    id:null,
    username:null,
    displayName:null,
    service: null
}

var Ravenfall = {
    twitch: {
        id: null,
        username: null,
        displayName: null
    },
    id: null,
    characterId: null,
    character: null,
    characters: null,
    token: null,
    isAuthenticated: false,
    updated: null,
    service: null,
    extension: null,

    pollInterval: 3000,

    getTaskBySkill: function(skill) {
        if (Ravenfall.isCombatSkill(skill)) {
            return 'fighting';
        }
        return skill;
    },

    getTaskArgumentBySkill: function (skill) {
        if (skill == 'health') {
            return 'all';
        }
        return skill;
    },

    getCurrentSkill: function () {
        if (Ravenfall.character == null || Ravenfall.character.state.task == null) {
            return null;
        }
        const state = Ravenfall.character.state;
        if (state.task.toLowerCase() == 'fighting') {
            return state.taskArgument.toLowerCase();
        }
        return state.task.toLowerCase();
    },

    isCharactersLoaded: function() {
        return Ravenfall.characters != null && Ravenfall.characters.length > 0;
    },

    isCombatSkill: function (skill) {
        return skill == 'attack' || skill == 'health' ||
            skill == 'defense' || skill == 'strength' ||
            skill == 'ranged' || skill == 'magic' ||
            skill == 'healing';
    },
};

var Streamer = {
    twitch: {
        id: null,
        username: null,
        displayName: null
    },
    ravenfall: {
        id: null,
        clientVersion: null,
        session: {
            id: null,
            playerCount: 0,
            isActive: false,
            startedDateTime: null,
        }
    },
    updated: null,
};


var ViewStates = {
    NONE: 'NONE',
    GAME_NOT_RUNNING: 'GAME_NOT_RUNNING',
    ANONYMOUS_USER: 'ANONYMOUS_USER',
    NO_USER_ACCOUNT: 'NO_USER_ACCOUNT',
    ALL_AUTH_OK: 'ALL_AUTH_OK',
    CHARACTER_SELECTION: 'CHARACTER_SELECTION',

    JOINING_GAME: 'JOINING_GAME',
    PLAYING: 'PLAYING',
    GAME_JOIN_FAILED: 'GAME_JOIN_FAILED',

    CONNECTION_ERROR: 'CONNECTION_ERROR'
};


var twitch = window.Twitch.ext;

// update __NO_DEVELOPER_RIG__ from modules/states.js
if (__NO_DEVELOPER_RIG__ === false) {
  window.console.log = twitch.rig.log;
}
