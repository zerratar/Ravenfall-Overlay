import { MainView } from "./BaseViews.js";
import { AnonymousUserView } from "./AnonymousUserView.js";
import { ConnectionErrorView } from "./ConnectionErrorView.js";
import { GameNotRunningView } from "./GameNotRunningView.js";


export class ErrorView extends MainView {
    constructor() {
        super('error');

        this.anonymousUser = new AnonymousUserView(this);
        this.ConnectionError = new ConnectionErrorView(this);
        this.gameNotRunning = new GameNotRunningView(this);
    }

    onAnonymousUser() {
        this.setView(this.anonymousUser);
    }

    onConnectionError() {
        this.setView(this.ConnectionError);
    }

    onGameNotRunning() {
        this.setView(this.gameNotRunning);
    }
}
