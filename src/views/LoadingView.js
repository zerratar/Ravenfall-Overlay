import { MainView } from "./BaseViews.js";

export class LoadingView extends MainView {
	constructor() {
		super('loading');
	}

	onEnter() {
		console.log("Loading extension...");
		let twitch = window.Twitch.ext;
		// update isLocalTest from modules/states.js
		if (isLocalTest === true) { // http://localhost:5500/src/
			console.warn("We are running in debug mode. This will not work on Twitch!");
			// note(zerratar): auth token must be set in production
			Viewer.userId = debug_viewer.id;
			Ravenfall.service.setAuthInfo({
				channelId: debug_streamer.id,
				userId: debug_viewer.id,
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
			} else {
				console.error("Twitch extension could not be properly initialized. 'window.Twitch.ext' is undefined.");
			}
		}
	}
}
