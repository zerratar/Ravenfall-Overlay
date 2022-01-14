/*
Author: AbbyCottontail
Created On: 2022-01-08

Description: global-loader.js load configurations from enviro (if it exists) if not, use a default value

*/

export default class ConfigurationLoader {
    isClassReady;
    static defaultExtensionValues = {
        name: "extension",
    
        ravenfall: 
        {
            rf_url:"https://www.ravenfall.stream/",
            rf_api: this.rf_url+"api/",
            rf_api_auth: this.rf_api+"auth",
            rf_api_player: this.rf_api+"players",
            rf_api_twitch_extension: this.rf_api+"twitch/extension",
            rf_websocket_url:"wss://www.ravenfall.stream/api/stream/extension",
            rf_obj: {
                skillNames:[
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
                ],
                rf_twitch_viewer:{
                    id:null,
                    username:null,
                    displayName:null,
                    service: null
                },
                rf_player:{
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
                    }
                },
                rf_twitch_streamer:{
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
                },
                
            } 
        },
        twitch: 
        {
            NO_DEVELOPER_RIG:true,
            streamer_username:null,
            streamer_id:null,
            your_username:null,
            your_id:null
    
        },
    
        enviro: 
        {
            developer_rig:false,
            logging:[]
        },
        extention_viewstates:{
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
        
        }
    };
   

    constructor() {    }

    static async initValues() {
        ConfigurationLoader.isClassReady = false;
        //Load Default Values
        //console.log(this.defaultExtensionValues);

        const handler = {
            get: function(target, prop) {
                if(target.hasOwnProperty(prop))
                {
                    return target[prop];
                } else {
                    console.log(prop);
                    console.log("hasOwn")
                    return ConfigurationLoader.defaultExtensionValues.hasOwnProperty(prop) ? ConfigurationLoader.defaultExtensionValues[prop] : undefined;
                }
            }
        }
        let declaredValues;

        try {
            let {default: DefinedValues} = await import('../var/enviro.js');
            //Pull obj from enviro.js. There's an upcoming feature that allow pulling from .json but it's not in.
            //It's possible to make enviro.js more simple but I couldn't figure out how to pull the object from the Module, best hint I got was something about destructuring 
            let classObj = new DefinedValues();
            declaredValues = classObj.thisObj();
        }
        catch(err) {
            
            if (err instanceof TypeError) {
                // statements to handle TypeError exceptions - most likely unable to fetch dynamically the imported module
                declaredValues = {};
            }
        }
        
        ConfigurationLoader.filledPropteries = new Proxy(declaredValues, handler);
        ConfigurationLoader.isClassReady = true;

        return new ConfigurationLoader();
        
    }

    //Only when this class is ready can we act on it.
    getObj(property) {
        return ConfigurationLoader.isClassReady ? ConfigurationLoader.filledPropteries[property] : undefined;
    }
}