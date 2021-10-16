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