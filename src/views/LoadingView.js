import { MainView } from "./BaseViews.js";


export class LoadingView extends MainView {
    constructor() {
        super('loading');
    }

    onEnter() {
        // update __NO_DEVELOPER_RIG__ from modules/states.js
        if (window.gExtDevelopment.no_developer_rig === true) {
            // note(zerratar): auth token must be set in production
            window.gLogic.ravenfall.setAuthInfo(window.gExtDevelopment.twitch_development.your_username, window.gExtDevelopment.twitch_development.your_id, null);
        } else {
            
            if (typeof window.Twitch.ext != 'undefined') 
            {
                window.Twitch.ext.onContext(function (context) {
                    window.Twitch.ext.rig.log(context);
                });

                window.Twitch.ext.onAuthorized(function (auth) {
                    window.gLogic.setAuthInfo(auth.channelId, auth.userId, auth.token);
                });
            }
        }
    }
}
