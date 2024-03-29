import RavenfallService from "./resources/js/ravenfall-service.js";
import TwitchService from "./resources/js/twitch-service.js";
import { LoadingView } from './views/LoadingView.js';
import { ErrorView } from "./views/ErrorView.js";
import { DefaultView } from "./views/DefaultView.js";

export default class RavenfallExtension {
    constructor() {
        this.twitchService = new TwitchService();
        this.ravenfallService = new RavenfallService(x => this.onCharacterUpdated(x));
        this.ravenfallService.onConnectionClosed((data) => this.onConnectionLost(data));
        this.lastUpdate = 0;
        this.views = {
            loading: new LoadingView(),
            default: new DefaultView(),
            error: new ErrorView()
        };
        this.appContainer = document.querySelector('#app');
        this.pollTimer = 1;
        this.lastUpdate = 0;
        this.activeView = null;
        this.ravenfallService.loadItemsAsync();
        this.setView(this.views.loading);
        this.update(0);
    }

    onConnectionLost(data) {
        if (data.code == 1006 || data.code == 1011 || data.gameSessionEnded == false) {
            console.log('Connection lost. Trying to reconnect...');
            Ravenfall.service.websocket.setSessionId(null);
            Ravenfall.service.requests.setSessionId(null);
            Ravenfall.isAuthenticated = false;
            this.onBadServerConnection();
            // 1006 = server died
            // 1011 = we fail to recover from server restart, server has no session matching ours.            
        }
    }

    setView(view) {
        const oldView = this.activeView;
        let newView = oldView == null || oldView != view;

        if (oldView != null) {
            oldView.deactivate();
        }

        if (oldView != null && newView) {
            oldView.onExit();
        }

        this.activeView = view;
        this.activeView.activate();
        if (newView == true) {
            this.activeView.onEnter();
        }
    }

    onCharacterUpdated(character) {
        this.setView(this.views.default);

        if (character == null || typeof character == 'undefined') {
            if (Ravenfall.service.isRavenfallAvailable && Ravenfall.isCharactersLoaded()) {
                this.activeView.onShowCharacterSelection();
            }
            return;
        }

        this.activeView.onCharacterUpdated(character);

        if (character != null && Views.overview) {
            Views.overview.onGameStateUpdated(Ravenfall.gameState);
        }
    }

    onBadServerConnection() {
        this.pollTimer = Ravenfall.pollInterval;
        this.views.error.onBadServerConnection();
        this.setView(this.views.error);
    }

    onGameNotRunning() {
        this.pollTimer = Ravenfall.pollInterval;
        this.views.error.onGameNotRunning();
        this.setView(this.views.error);
    }

    async update(time) {
        const delta = time - this.lastUpdate;
        await this.handleGameStatePollAsync(delta);
        this.updateInternal(delta);
        this.lastUpdate = time;
        window.requestAnimationFrame(async t => await this.update(t));
    }

    async loadCharactersAsync() {
        if (!Ravenfall.isAuthenticated) {
            // failed to authenticate    
            // user probably does not exist.
            // so we will try and get the twitch user info
            console.error('Failed to authenticate with ravenfall. Most likely has no user.');
            if (!Ravenfall.service.twitchUserId.toLowerCase().startsWith('u')) {
                this.views.error.onAnonymousUser();
                this.setView(this.views.error);

            } else {
                this.views.default.onShowAccountCreation();
                this.setView(this.views.default);
            }
            return;
        }


        { // DEBUG
            // const sessionInfo = JSON.stringify(Ravenfall.service.sessionInfo);
            // console.log('Authenticated with ravennest: ' + sessionInfo);
        } // END DEBUG

        if (Ravenfall.service.isRavenfallAvailable && !Ravenfall.isCharactersLoaded()) {
            await Ravenfall.service.getCharactersAsync();
            if (!Ravenfall.service.hasActiveCharacter()) {
                this.onCharacterUpdated(null);
            }
        }
    }

    get isReady() {
        return Ravenfall.service.websocket.connected && Ravenfall.service.isRavenfallAvailable && Ravenfall.isCharactersLoaded();
    }

    updateDefaultView() {
        if (this.activeView != this.views.default) {
            this.setView(this.views.default);
        }

        this.activeView.update();
    }

    // bad naming convention
    // but this is suppose to update things that we want to give a more responsive feel to
    // like character resting amount, or the time left on a level up, raid timeout, dungeon start, etc.
    updateInternal(deltaMs) {
        // check if we have an active character, otherwise return.
        let char = Ravenfall.service.getActiveCharacter();
        if (char == null || typeof char == 'undefined') {
            return; // nope.
        }

        // Handle rested state
        this.updateRestedTime(deltaMs, char);

        // check if we have a game state that we could update. example: raid timeout, dungeon start, etc.
        if (Ravenfall.gameState == null || typeof Ravenfall.gameState == 'undefined') {
            return; // no game state avialable. so lets say bye bye
        }
    }

    updateRestedTime(deltaMs, char) {
        let restedLastUpdated = char.state.restedUpdated;
        if (typeof restedLastUpdated == 'undefined') {
            restedLastUpdated = new Date();
        }

        let dateNow = new Date();
        let elapsedSeconds = Math.abs(dateNow - restedLastUpdated) / 1000;
        let deltaSeconds = deltaMs / 1000;
        if (elapsedSeconds > 0) {
            let restedSeconds = char.state.restedTime;
            if (char.state.inOnsen === true) {
                // tick up
                char.state.restedTime += (deltaSeconds * 2);
            } else {
                // tick down
                char.state.restedTime -= deltaSeconds;
            }
        }
    }

    async handleGameStatePollAsync(delta) {

        if (this.isReady) {
            // if we are connected to the websocket
            // then we already have a broadcaster id and session id
            // and the most important thing. An active connection.
            // we will rely on the websocket state updates instead

            // another note: if "isReady" is true then 
            // we should re-establish the view state

            this.updateDefaultView();
            return;
        }

        if (Streamer.twitch.id == null || Viewer.userId == null) {
            // We don't have a twitch id or a viewer id yet. 
            // record how long we are without an Id to give a better error message to the user
            Ravenfall.timeWithoutId += delta;

            this.appContainer.classList.toggle('id-unavailable', Ravenfall.timeWithoutId >= 3000);
            this.views.error.onAnonymousUser();
            this.setView(this.views.error);
            return;
        }

        Ravenfall.timeWithoutId = 0;

        if (Ravenfall.timeWithoutId > 0) {
            this.appContainer.classList.toggle('id-unavailable', false);
        }

        if (this.pollTimer <= 0) {
            return;
        }

        this.pollTimer -= delta;
        if (this.pollTimer > 0) {
            return;
        }

        if (!Ravenfall.isAuthenticated && !await Ravenfall.service.authenticateAsync()) {
            this.onBadServerConnection();
            return;
        }

        const streamerInfo = await Ravenfall.service.getStreamerSessionAsync();
        if (streamerInfo == null && Ravenfall.service.requests.serverError == true) {
            this.onBadServerConnection();
            return;
        }

        if (!Ravenfall.service.isRavenfallAvailable) {
            this.onGameNotRunning();
            return;
        }

        if (!Ravenfall.isCharactersLoaded()) {
            await this.loadCharactersAsync();
        }

        if (Ravenfall.service.websocket.canConnect) {
            await Ravenfall.service.websocket.connectAsync();
        }

        this.updateDefaultView();
        this.pollTimer = Ravenfall.pollInterval;
    }
}

Ravenfall.extension = new RavenfallExtension();