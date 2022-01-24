import { MainView } from "./BaseViews.js";


export class LoadingView extends MainView {
    constructor() {
        super('loading');
    }

    onEnter() {
        // update __NO_DEVELOPER_RIG__ from modules/states.js
        if (window.gExtDevelopment.no_developer_rig === true) {
            // note(zerratar): auth token must be set in production
            window.gStreamer.twitch.id = window.gExtDevelopment.twitch_development.streamer_id;
            window.gViewer.id = window.gExtDevelopment.twitch_development.your_id;
            window.gViewer.updated = new Date();
            window.gLogic.ravenfall.setAuthInfo();
        } else {
            if (typeof window.Twitch.ext != 'undefined') 
            {
                window.Twitch.ext.onContext(function (context) {
                    window.Twitch.ext.rig.log(context);
                });

                window.Twitch.ext.onAuthorized(function (auth) {
                    window.gLogic.twitch.processJWT(auth);
                    window.gLogic.ravenfall.setAuthInfo();
                    window.gLogic.twitch.processViewer(window.Twitch.ext.viewer);
                });
            }
        }
    }
}
