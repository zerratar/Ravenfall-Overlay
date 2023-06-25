import { MainView } from "./BaseViews.js";
import { AnonymousUserView } from "./AnonymousUserView.js";
import { BadServerConnectionView } from "./BadServerConnectionView.js";
import { GameNotRunningView } from "./GameNotRunningView.js";


export class ErrorView extends MainView {
    constructor() {
        super('error');

        this.anonymousUser = new AnonymousUserView(this);
        this.badServerConnection = new BadServerConnectionView(this);
        this.gameNotRunning = new GameNotRunningView(this);
    }

    update() {
        super.view.update();
    }

    onAnonymousUser() {
        this.setView(this.anonymousUser);
    }

    onBadServerConnection() {
        this.setView(this.badServerConnection);
    }

    onGameNotRunning() {
        this.setView(this.gameNotRunning);
    }
}
