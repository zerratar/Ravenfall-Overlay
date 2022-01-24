import RavenfallService from "./ravenfall-service.js";
import TwitchService from "./twitch-service.js";
import { LinkTwitchView } from '../views/LinkTwitchView.js';
import { LoadingView } from '../views/LoadingView.js';
import { ErrorView } from "../views/ErrorView.js";
import { DefaultView } from "../views/DefaultView.js";


/*
* 
*/
export default class RavenfallExtension {

    constructor() {
        this.ravenfallService = new RavenfallService(x => this.onCharacterUpdated(x));
        this.ravenfallService.onConnectionClosed((data) => this.onConnectionLost(data));
        this.lastUpdate = 0;
        this.views = {
            loading: new LoadingView(),
            linktwitch: new LinkTwitchView(),
            default: new DefaultView(),
            error: new ErrorView()
        };
        this.pollTimer = 1;
        this.lastUpdate = 0;
        this.activeView = null;
        this.setView(this.views.loading);
        this.update(0);
    }

    onConnectionLost(data) {
        if (data.code == 1006 || data.code == 1011 || data.gameSessionEnded == false) {
            window.gRavenfall.service.websocket.setSessionId(null);
            window.gRavenfall.service.requests.setSessionId(null);
            window.gRavenfall.isAuthenticated = false;
            this.onConnectionError();
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
            if (window.gLogic.ravenfall.isRavenfallAvailable && window.gRavenfallPlayer.isCharactersLoaded()) {
                this.activeView.onShowCharacterSelection();
            }
            return;
        }

        this.activeView.onCharacterUpdated(character);
    }

    onConnectionError() {
        this.pollTimer = window.gLogic.pollInterval * 3;
        this.views.error.onConnectionError();
        this.setView(this.views.error);
    }

    onGameNotRunning() {
        this.pollTimer = window.gLogic.pollInterval;
        this.views.error.onGameNotRunning();
        this.setView(this.views.error);
    }

    
    /*
    * update(duration)
    * Wait until handleGameStatePollAsync has finished
    */
    async update(duration) {
        const delta = duration - this.lastUpdate;
        await this.handleGameStatePollAsync(delta);
        this.lastUpdate = duration;
        window.requestAnimationFrame(async t => await this.update(t));
    }

    async getLinkedId() {
        this.setView(this.views.linktwitch);
    }

    async loadCharactersAsync() {

        if (!window.gRavenfall.isAuthenticated) {            
            console.error('Failed to authenticate with ravenfall. Unknown ID, new user?');
            //might be a new Users
            if (!window.gViewer.has_linked) {
                this.views.error.onAnonymousUser();
                this.setView(this.views.error);

            } else {
                this.views.default.onShowAccountCreation();
                this.setView(this.views.default);
            }
        }


        { // DEBUG
            const sessionInfo = JSON.stringify(window.gRavenfall.service.sessionInfo);
            console.log('Authenticated with ravennest: ' + sessionInfo);
        } // END DEBUG

        if (Ravenfall.service.isRavenfallAvailable && !Ravenfall.isCharactersLoaded()) {
            await Ravenfall.service.getCharactersAsync();
            if (!Ravenfall.service.hasActiveCharacter()) {
                this.onCharacterUpdated(null);
            }
        }
    }

    get isReady() {
        
        return window.gRavenfall.service.websocket.connected && window.gRavenfall.service.isRavenfallAvailable && window.gRavenfall.isCharactersLoaded();
    }

    updateDefaultView() {
        if (this.activeView != this.views.default) {
            this.setView(this.views.default);
        } 
        
        this.activeView.update();
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

        if (this.pollTimer <= 0) {
            return;
        }

        this.pollTimer -= delta;
        if (this.pollTimer > 0) {
            return;
        }

        if(!window.gViewer.has_linked) {
            //user has not linked their profile to the extension yet - show connection
            await this.getLinkedId();
            this.setView(this.views.loading);
        }

        if (!window.gLogic.isAuthenticated && !await window.gLogic.ravenfall.authenticateAsync()) {
            this.onConnectionError();
            return;
        }

        const streamerInfo = await window.gLogic.ravenfall.getStreamerSessionAsync();
        if (streamerInfo == null && window.gLogic.ravenfall.requests.serverError == true) {
            this.onConnectionError();
            return;
        }

        if (!window.gRavenfall.gLogic.ravenfall.isRavenfallAvailable) {
            this.onGameNotRunning();
            return;
        }

        if (!window.gLogic.ravenfall.isCharactersLoaded()) {
            await this.loadCharactersAsync();
        }

        if (window.gLogic.ravenfall.websocket.canConnect) {
            await window.gLogic.ravenfall.websocket.connectAsync();
        }

        this.updateDefaultView();
        this.pollTimer = Ravenfall.pollInterval;
    }
}
