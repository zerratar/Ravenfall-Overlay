var maximum_allowed_characters = 3; // change this if we want to introduce a 4th or 5th character
// changing maximum: see PlayerManager.cs:27, RavenNest.BusinessLogic Kappa

// var ravenfallApiUrl = 'https://localhost:5001/api/';
// var ravenfallWebsocketApiUrl = 'wss://localhost:5001/api/stream/extension';
var ravenfallApiUrl = 'https://www.ravenfall.stream/api/';
var ravenfallWebsocketApiUrl = 'wss://www.ravenfall.stream/api/stream/extension';

// SET __NO_DEVELOPER_RIG__ = true; if NOT using the twitch developer rig
var __NO_DEVELOPER_RIG__ = true;

var __streamer_twitch_username = 'abbycottontail';
var __streamer_twitch_id = '39575045';
var __your_twitch_username = 'abbycottontail';
var __your_twitch_id = '39575045';

// var __streamer_twitch_username = 'zerratar';
// var __streamer_twitch_id = '72424639';
// var __your_twitch_username = 'zerratar';
// var __your_twitch_id = '72424639';

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
    updated: null
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

    BAD_SERVER_CONNECTION: 'BAD_SERVER_CONNECTION'
};