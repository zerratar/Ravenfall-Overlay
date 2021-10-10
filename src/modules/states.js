export var UserState = {
    twitch: {
        id: null,
        username: null,
        displayName: null
    },
    ravenfall: {
        id: null,
        characters: null,
    }
};

export var PlayerState = {
    character: null,
    is: {
        playing: false,
        training: false,
    },
    in: {
        onsen: false,
        dungeon: false,
        arena: false,
        raid: false,
        duel: false
    }
};

export var StreamerState = {
    twitch: {
        id: null,
        username: null,
        displayName: null
    },
    ravenfall: {
        id: null,
        session: {
            id: null,
            playerCount: 0,
            running: false
        }
    }
};

export var AppState = {};