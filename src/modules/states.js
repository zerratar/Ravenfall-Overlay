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
  