import { MainView } from "./BaseViews.js";


export class LoadingView extends MainView {
    constructor() {
        super('loading');
    }

    onEnter() {
        let twitch = window.Twitch.ext;
        // update __NO_DEVELOPER_RIG__ from modules/states.js
        if (__NO_DEVELOPER_RIG__ === true) {
            // note(zerratar): auth token must be set in production
            Ravenfall.service.setAuthInfo({ 
                channelId: __streamer_twitch_id, 
                userId: __your_twitch_id, 
                token: null,
                helixToken: null,
            });
        } else {
            if (typeof twitch != 'undefined') {

                twitch.onContext(function (context) {
                    // console.log(context);
                    Ravenfall.service.setContext(context);
                });

                twitch.onAuthorized(function (auth) {
                    Ravenfall.service.setAuthInfo(auth);
                });
                
                if (!window.Twitch.ext.viewer.isLinked) {
                    twitch.actions.requestIdShare();
                }
            }
        }
    }
}
