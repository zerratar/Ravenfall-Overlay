"use strict"
/*
Author: AbbyCottontail
Created On: 2022-01-08

Description: Ravefall-Main.js is the loading Javascript for all of Ravenfall Twitch Extension's Logic

*/

import RavenfallExtension from "./modules/ravenfall-extension.js";
import Loader from "./modules/global-loader.js";

async function onRavenfallLoad() {
    //will check for enviro.js for any defined values or pulls a default set. Useful for using a file as a debugFile.
    window.rf = await Loader.initValues(); 
    //console.log(window.rf.getObj("enviro"));

    window.gRavenfall = window.rf.getObj("ravenfall").rf_obj.rf_player;
    window.gStreamer = window.rf.getObj("ravenfall").rf_obj.rf_twitch_streamer;
    window.gViewer = window.rf.getObj("ravenfall").rf_obj.rf_twitch_viewer;

    window.gRavenfall.extension = new RavenfallExtension();
};

$(document).ready(onRavenfallLoad);





