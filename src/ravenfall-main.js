"use strict"
/*
Author: AbbyCottontail
Created On: 2022-01-08

Description: Ravefall-Main.js is the loading Javascript for all of Ravenfall Twitch Extension's Logic

*/

import ExtensionInteraction from "./modules/extension-interactions.js";
import RavenfallExtension from "./modules/ravenfall-extension.js";
import Loader from "./modules/global-loader.js";

var isThisReady = false;
var tryAgain = false;

function onRavenfallLoad() {
    if(!isThisReady) {
        console.log("global var not loaded")
        tryAgain = true;
    } else {
        new ExtensionInteraction();
        window.gLogic.extension = new RavenfallExtension();
    }
    
};

async function onScriptLoad() {
    //will check for enviro.js for any defined values or pulls a default set. Useful for using a file as a debugFile.
    window.rf = await Loader.initValues(); 
    //console.log(window.rf.getObj("enviro"));

    window.gExtDevelopment = window.rf.getObj("enviro");
    //console.log("gotType: " + window.rf.getObj("ravenfall").logic);
    window.gLogic = window.rf.getObj("ravenfall").logic;
    window.gRavenfallUrl = window.rf.getObj("ravenfall").ravenfall_url;
    window.gRavenfallPlayer = window.rf.getObj("ravenfall").rf_obj.rf_player;
    window.gStreamer = window.rf.getObj("ravenfall").rf_obj.rf_twitch_streamer;
    window.gViewer = window.rf.getObj("ravenfall").rf_obj.rf_twitch_viewer;

    isThisReady = true;
    if(tryAgain)
    {
        onRavenfallLoad();
        tryAgain = false;
    }

    //window.addEventListener('message', (event) => {
    //    console.log(event);
    //  });
}



await onScriptLoad();

$(document).ready(onRavenfallLoad);






