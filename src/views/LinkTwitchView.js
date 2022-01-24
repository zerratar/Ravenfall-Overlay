import { MainView } from "./BaseViews.js";


export class LinkTwitchView extends MainView {
    constructor() {
        super('linktwitch');
        this.setupEvents();
    }

    setupEvents() {

        const linkTwitchBtn = document.querySelector('.btn-create-account');
        linkTwitchBtn.addEventListener('click', (event) => {
            event.preventDefault();
            this.linkTwitch();
        });

    }

    linkTwitch()
    {
        window.Twitch.ext.actions.requestIdShare();
    }
}
