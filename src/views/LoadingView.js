import { MainView } from "./BaseViews.js";


export class LoadingView extends MainView {
    constructor() {
        super('loading');
    }

    onEnter() {
        let twitch = window.Twitch.ext;
        // update isLocalTest from modules/states.js
        if (isLocalTest === true) {
            // note(zerratar): auth token must be set in production
            Viewer.userId = __your_twitch_id;
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
                    if (window.Twitch.ext.viewer.isLinked == false) {
                        twitch.actions.requestIdShare();
                    } else {
                        Ravenfall.service.setAuthInfo(auth);
                    }
                });
            }
        }
    }
}
