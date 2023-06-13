var maximum_allowed_characters = 3; // change this if we want to introduce a 4th or 5th character
// changing maximum: see PlayerManager.cs:27, RavenNest.BusinessLogic Kappa

var isLocalTest = false;

var __streamer_twitch_username = 'zerratar';
var __streamer_twitch_id = '72424639';
var __your_twitch_username = 'zerratar';
var __your_twitch_id = '72424639';

var ravenfallUrl = 'https://www.ravenfall.stream/';
var ravenfallApiUrl = ravenfallUrl+'api/';
var ravenfallWebsocketApiUrl = 'wss://www.ravenfall.stream/api/stream/extension';
if (isLocalTest) {
    ravenfallUrl = 'https://localhost:5001/';
    ravenfallApiUrl = 'https://localhost:5001/api/';
    ravenfallWebsocketApiUrl = 'wss://localhost:5001/api/stream/extension';
}


var skillNames = [
    'attack',
    'defense',
    'strength',
    'health',
    'woodcutting',
    'fishing',
    'mining',
    'crafting',
    'cooking',
    'farming',
    'slayer',
    'magic',
    'ranged',
    'sailing',
    'healing'
];

// not guaranteed to be loaded, but we need to store it somewhere for easy access.
// another approach is to have a ViewProvider that handles all views and their creation
var Views = {
    islands:null,
    training:null,
    inventory:null,
    marketplace:null,
    vendor:null,
    overview:null,
    characterSelection:null,
    clan:null,
};

var Viewer = {
    userId:null,
    opaqueId:null,
    username:null,
    displayName:null,
    service: null,
    token:null,
    helixToken:null,
}

var Ravenfall = {
    twitch: {
        id: null,
        username: null,
        displayName: null
    },
    gameState: {
        playerCount:0,
        dungeon: {
          isActive:false,
          name:null,
          hasStarted:false,
          bossCombatLevel:0,
          currentBossHealth:0,
          maxBossHealth:0,
          playersAlive:0,          
          playersJoined:0,
          enemiesLeft:0,
          timeUntilStartSeconds:0,
          secondsUntilNextDungeon:0
        },          
        raid: {
          isActive:false,
          bossCombatLevel:0,
          currentBossHealth:0,
          maxBossHealth:0,
          playersJoined:0,
          secondsLeft:0,
          secondsUntilNextRaid:0
        }
      },
    itemsLoaded: false,
    items: [],
    id: null,
    characterId: null,
    character: null,
    characters: null,
    token: null,
    helixToken: null,
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

    getSkillNameByIndex: function (index) {
        if (index < 0 || index >= skillNames.length) {
            return null;
        }
        return skillNames[index];
    },

    getCharacterById: function(id){
        if (Ravenfall.characters == null || Ravenfall.characters.length ==0){
            return null;
        }
        return Ravenfall.characters.find(x=>x.id == id);
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
        if (skill == null) {
            return false;
        }
        skill = skill.toLowerCase();
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

    BAD_SERVER_CONNECTION: 'BAD_SERVER_CONNECTION'
};