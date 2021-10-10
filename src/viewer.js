import TwitchService from "./modules/twitch-service.js";
import Requests from "./modules/requests.js";
import { RavenfallService, ViewStates } from "./modules/ravenfall-service.js";
import { UserState, PlayerState, StreamerState, AppState } from "./modules/states.js";


var gamestatePollTimer = undefined;

// SET __NO_DEVELOPER_RIG__ = true; if NOT using the developer rig
var __NO_DEVELOPER_RIG__ = true;

var __streamer_twitch_username = 'abbycottontail';
var __streamer_twitch_id = '39575045';
var __your_twitch_username = 'abbycottontail';
var __your_twitch_id = '39575045';

// var __streamer_twitch_username = 'zerratar';
// var __streamer_twitch_id = '72424639';
// var __your_twitch_username = 'zerratar';
// var __your_twitch_id = '72424639';

let movingToggleButton = false;
const extension = document.querySelector('.extension');
const extensionDarkMode = document.querySelector('.btn-toggle-dark-mode');
const extensionViews = document.querySelectorAll('.view');
const extensionToggleButton = document.querySelector('.extension-toggle');
const extensionCloseButton = document.querySelector('.btn-close-panel');
const extensionPanel = document.querySelector('.extension');

const characterStats = document.querySelector('.character-stats');
const characterStatsTemplate = document.querySelector('.character-stat').outerHTML;
characterStats.innerHTML = '';


const characterList = document.querySelector('.character-list');

const leaveGameBtn = document.querySelector('.btn-leave-game');

const toggleDarkTheme = () => {
  if (extension.classList.contains('dark-theme')) {
    extension.classList.remove('dark-theme');
    extensionDarkMode.innerHTML = '&blk34;';
  } else {
    extension.classList.add('dark-theme');
    extensionDarkMode.innerHTML = '&blk14;';
  }
}
// Hax
toggleDarkTheme();
toggleDarkTheme();

if (__NO_DEVELOPER_RIG__ == false) {
  const twitch = window.Twitch.ext;
  window.console.log = twitch.rig.log;
}

var currentState = ViewStates.NONE;

// onCharacterSkillsUpdated()

const req = new Requests();
const twitchService = new TwitchService(req);
const ravenfall = new RavenfallService(req, s => onStateUpdated(s), c => onCharacterChanged(c));

const writeDebugText = (text, clear) => {
  const before = clear === true ? '' : $('.debug-info').html();
  $('.debug-info').html(before + ' ' + text);
};

const onRavenfallAuth = async () => {
  if (ravenfall.sessionInfo == null) {
    // failed to authenticate    
    // user probably does not exist.
    // so we will try and get the twitch user info
    console.log('Failed to authenticate with ravenfall. Most likely has no user.');
    if (!ravenfall.twitchUserId.toLowerCase().startsWith('u')) {
      onStateUpdated(ViewStates.ANONYMOUS_USER);
    } else {
      onStateUpdated(ViewStates.NO_USER_ACCOUNT);
    }
    return;
  }

  const sessionInfo = JSON.stringify(ravenfall.sessionInfo);
  console.log('Authenticated with ravennest: ' + sessionInfo);

  // writeDebugText(sessionInfo);

  if (ravenfall.isRavenfallAvailable) {
    UserState.ravenfall.characters = await ravenfall.getCharactersAsync();
  }
};

const createNewUserAccount = () => {
  if (ravenfall.isAuthenticated) {
    return;
  }

  if (!ravenfall.twitchUserId.toLowerCase().startsWith('u')) {
    return;
  }

  twitchService.getTwitchUser(ravenfall.twitchUserId).then(user => {
    if (user && typeof user.name != undefined) {
      ravenfall.createUserAsync(user.name, user.display_name).then(() => onRavenfallAuth());
    }
  });
};


if (__NO_DEVELOPER_RIG__ === true) {
	  ravenfall.setAuthInfo(__streamer_twitch_id, __your_twitch_id, null);
}
else {
  twitch.onContext(function (context) {
    twitch.rig.log(context);
  });

	twitch.onAuthorized(function (auth) {
	  ravenfall.setAuthInfo(auth.channelId, auth.userId, auth.token);
	});
}

const pollGameState = async () => {
  if (gamestatePollTimer && typeof gamestatePollTimer != undefined) {
    clearTimeout(gamestatePollTimer);
    gamestatePollTimer = undefined;
  }

  const timeout = (!!ravenfall.streamerInfo || ravenfall.requests.serverError == true) ? 5000 : 1500;
  const streamerInfo = await ravenfall.getStreamerSessionAsync();

  if (streamerInfo == null && ravenfall.requests.serverError == true) {
    onStateUpdated(ViewStates.BAD_SERVER_CONNECTION);
  }

  if (!ravenfall.isRavenfallAvailable) {
    onStateUpdated(ViewStates.GAME_NOT_RUNNING);
  }

  if (ravenfall.isRavenfallAvailable && !ravenfall.isAuthenticated) {
    ravenfall.authenticateAsync().then(() => onRavenfallAuth());
  }
  
  gamestatePollTimer = setTimeout(() => pollGameState(), timeout);
};

function getTaskBySkill(skill) {
  if (isCombatSkill(skill)) {
    return 'fighting';
  }
  return skill;
}

function getTaskArgumentBySkill(skill) {
  if (skill == 'health') {
    return 'all';
  }
  return skill;
}

function isCombatSkill(skill) {
  return skill == 'attack' || skill == 'health' ||
    skill == 'defense' || skill == 'strength' ||
    skill == 'ranged' || skill == 'magic' ||
    skill == 'healing';
}

function onCharacterChanged(character) {  
  if (character == null || typeof character == undefined) {
    onStateUpdated(ViewStates.CHARACTER_SELECTION);
    return;
  }

  PlayerState.character = character;

  characterStats.innerHTML = '';
  const props = Object.keys(character.skills);
  for (let prop of props) {
    if (prop.indexOf('Level') > 0) {
      const skill = prop.replace('Level', '');
      const level = character.skills[prop];
      const experience = character.skills[skill];
      const skillButton = document.createElement("div");
      characterStats.appendChild(skillButton);

      const trainable = skill != 'health' && skill != 'slayer' && skill != 'sailing' ? 'can-train' : '';

      skillButton.outerHTML = characterStatsTemplate
        .replace('{trainable}', trainable)
        .replace('{SkillName}', skill)
        .replace('{SkillName}', skill)
        .replace('{SkillName}', skill)
        .replace('{SkillLevel}', level)
        .replace('{SkillExperience}', experience);

      if (trainable != '') {
        document.querySelector('.btn-' + skill + '.can-train').addEventListener('click', () => {
          const task = getTaskBySkill(skill);
          const taskArg = getTaskArgumentBySkill(skill);
          ravenfall.setTaskAsync(task, taskArg);
        });
      }
    }
  }

  onStateUpdated(ViewStates.PLAYING);
}

function onStateUpdated(newState) {
  currentState = newState;

  extensionViews.forEach(elm => {
    if (elm.dataset.name === currentState) {
      elm.classList.add('active');
    } else {
      elm.classList.remove('active');
    }
  });

  switch (currentState) {

    case ViewStates.BAD_SERVER_CONNECTION:
      ravenfall.characters = null;
      ravenfall.activeCharacter = null;
      characterList.innerHTML = '';
      break;

    case ViewStates.CHARACTER_SELECTION:
      characterList.innerHTML = '';
      ravenfall.characters.forEach(x => {
        const characterSelectButton = document.createElement('div');
        characterSelectButton.classList.add('btn');
        characterSelectButton.classList.add('btn-character-select');
        characterSelectButton.character = x;
        characterSelectButton.innerHTML = '<span class="character-name">' + x.name + '</span> (<span class="character-alias">' + x.identifier + '</span>) <span class="combat-level">Lv.' + x.combatLevel + '</span>';
        characterSelectButton.addEventListener('click', elm => {
          writeDebugText(x.name + ' ' + x.identifier, true);
          ravenfall.joinSessionAsync(x);
        });
        characterList.appendChild(characterSelectButton);
      });
      break;
    case ViewStates.GAME_JOIN_FAILED:
      writeDebugText('Joined failed. ' + ravenfall.joinError, true);
      break;
    case ViewStates.AUTHENTICATING:
      // when authenticating with ravenfall website
      break;
    case ViewStates.GAME_NOT_RUNNING:
      // streamer does not have an active game session
      break;
    case ViewStates.ANONYMOUS_USER:
      // viewer has to accept extension permissions and share identity for this to work.
      break;
    case ViewStates.NO_USER_ACCOUNT:
      // User has no account. Ask them if they want to create one
      break;
    case ViewStates.PLAYING:
      // we are in game with a character.

      break;
  }
}

/* 
  All events 
*/

extensionDarkMode.addEventListener('click', () => {
  toggleDarkTheme();
});

extensionToggleButton.addEventListener('click', () => {
  if (movingToggleButton == true) {
    return;
  }
  extensionPanel.classList.remove('hidden');
  extensionToggleButton.classList.add('hidden');
});

extensionCloseButton.addEventListener('click', () => {
  extensionPanel.classList.add('hidden');
  extensionToggleButton.classList.remove('hidden');
});

leaveGameBtn.addEventListener('click', () => {
  ravenfall.leaveSessionAsync();
});

/*
  Make the toggle button draggable
*/

dragElement(document.getElementById("extension-toggle"));

function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  var mdX = 0,
    mdY = 0;
  elmnt.onmousedown = dragMouseDown;

  const elmPos = localStorage.getItem('rf-toggle-pos');

  if (elmPos && elmPos.indexOf(';') > 0) {
    const d = elmPos.split(';');
    elmnt.style.top = d[0];
    elmnt.style.left = d[1];
  }

  function dragMouseDown(e) {
    movingToggleButton = false;
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    mdX = pos3 = e.clientX;
    mdY = pos4 = e.clientY;

    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    movingToggleButton = true;

    localStorage.setItem('rf-toggle-pos', elmnt.style.top + ';' + elmnt.style.left);
  }

  function closeDragElement(e) {
    e = e || window.event;
    let dx = mdX - e.clientX;
    let dy = mdY - e.clientY;

    // to ensure that you can accidently just move slightly when
    // intention is to open the extension
    if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
      movingToggleButton = false;
    }

    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

pollGameState();