import { MainView } from "./BaseViews.js";


export class LoadingView extends MainView {
    constructor() {
        super('loading');
    }

    onEnter() {
        // update __NO_DEVELOPER_RIG__ from modules/states.js
        if (__NO_DEVELOPER_RIG__ === true) {
            // note(zerratar): auth token must be set in production
            Ravenfall.service.setAuthInfo(__streamer_twitch_id, __your_twitch_id, null);
        } else {
            if (typeof twitch != 'undefined') {
                twitch.onContext(function (context) {
                    twitch.rig.log(context);
                });

                twitch.onAuthorized(function (auth) {
                    Ravenfall.service.setAuthInfo(auth.channelId, auth.userId, auth.token);
                });
            }
        }
    }
}
