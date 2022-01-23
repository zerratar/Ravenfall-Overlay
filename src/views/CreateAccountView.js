import {
    SubView
} from "./BaseViews.js";

export class CreateAccountView extends SubView {
    constructor(parentView) {
        super(parentView, 'create-account');
        this.setupEvents();
    }

    setupEvents() {

        const createAccountBtn = document.querySelector('.btn-create-account');
        createAccountBtn.addEventListener('click', () => {
            this.createNewUserAccount();
        });

    }

    async createNewUserAccount() {
        if (window.gLogic.isAuthenticated) {
            return;
        }

        if (!window.gViewer.id.toLowerCase().startsWith('u')) {
            return;
        }

        const id = window.gViewer.id.substring(1);
        const user = await window.gLogic.twitch.getTwitchUser(id);
        if (user && typeof user.name != 'undefined') {
            await window.gLogic.ravenfall.createUserAsync(user.name, user.display_name);
            await window.gLogic.extension.loadCharactersAsync();
        }
    };
}