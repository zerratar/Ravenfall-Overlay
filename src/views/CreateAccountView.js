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
        if (Ravenfall.isAuthenticated) {
            return;
        }

        if (!Ravenfall.service.twitchUserId.toLowerCase().startsWith('u')) {
            return;
        }

        const id = Ravenfall.service.twitchUserId.substring(1);
        const user = await Viewer.service.getTwitchUser(id);
        if (user && typeof user.name != 'undefined') {
            await Ravenfall.service.createUserAsync(user.name, user.display_name);
            await Ravenfall.extension.loadCharactersAsync();
        }
    };
}