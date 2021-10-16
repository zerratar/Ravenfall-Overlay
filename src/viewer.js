import TwitchService from "./modules/twitch-service.js";
import Requests from "./modules/requests.js";
import {
  RavenfallService,
  ViewStates
} from "./modules/ravenfall-service.js";

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

let activeTaskBtn = null;
let movingToggleButton = false;
const extension = document.querySelector('.extension');
const extensionDarkMode = document.querySelector('.btn-toggle-dark-mode');
const extensionViews = document.querySelectorAll('.view');
const extensionToggleButton = document.querySelector('.extension-toggle');
const extensionCloseButton = document.querySelector('.btn-close-panel');
const characterStats = document.querySelector('.character-stats');
const characterStatsTemplate = document.querySelector('.character-stat').outerHTML;
characterStats.innerHTML = '';

const createAccountBtn = document.querySelector('.btn-create-account');
const characterList = document.querySelector('.character-list');
const leaveGameBtn = document.querySelector('.btn-leave-game');

createAccountBtn.addEventListener('click', () => {
  createNewUserAccount();
});

const toggleDarkTheme = () => {
  if (extension.classList.contains('dark-theme')) {
    extension.classList.remove('dark-theme');
    extensionDarkMode.innerHTML = '&blk34;';
  } else {
    extension.classList.add('dark-theme');
    extensionDarkMode.innerHTML = '&blk14;';
  }
}

// Note(zerratar): For some reason the "Toggle dark mode" button is rendered
//                 in the wrong place. calling the toggleDarkTheme seem to fix it.
//                 but since we dont want to enforce an inverted change we will toggle it twice.
toggleDarkTheme();
toggleDarkTheme();

if (__NO_DEVELOPER_RIG__ === false) {
  const twitch = window.Twitch.ext;
  window.console.log = twitch.rig.log;
}

var currentState = ViewStates.NONE;

const twitchService = new TwitchService();
const ravenfallService = new RavenfallService(s => onStateUpdated(s), c => onCharacterUpdated(c));

function writeDebugText(text, clear) {
  const before = clear === true ? '' : $('.debug-info').html();
  $('.debug-info').html(before + ' ' + text);
};

async function requestCharacterUpdateAsync() {
  if (!Ravenfall.isAuthenticated || Ravenfall.character == null) {
    return false;
  }

  return await ravenfallService.updateActiveCharacterAsync();
}

async function loadCharactersAsync() {
  if (!Ravenfall.isAuthenticated) {
    // failed to authenticate    
    // user probably does not exist.
    // so we will try and get the twitch user info
    console.error('Failed to authenticate with ravenfall. Most likely has no user.');
    if (!ravenfallService.twitchUserId.toLowerCase().startsWith('u')) {
      onStateUpdated(ViewStates.ANONYMOUS_USER);
    } else {
      onStateUpdated(ViewStates.NO_USER_ACCOUNT);
    }
    return;
  }

  const sessionInfo = JSON.stringify(ravenfallService.sessionInfo);
  console.log('Authenticated with ravennest: ' + sessionInfo);

  // writeDebugText(sessionInfo);

  if (ravenfallService.isRavenfallAvailable) {
    Ravenfall.characters = await ravenfallService.getCharactersAsync();
  }

  if (!ravenfallService.hasActiveCharacter()) {
    onStateUpdated(ViewStates.CHARACTER_SELECTION);
  }
};

async function createNewUserAccount() {
  if (Ravenfall.isAuthenticated) {
    return;
  }

  if (!ravenfallService.twitchUserId.toLowerCase().startsWith('u')) {
    return;
  }

  const id = ravenfallService.twitchUserId.substring(1);
  const user = await twitchService.getTwitchUser(id);
  if (user && typeof user.name != 'undefined') {
    await ravenfallService.createUserAsync(user.name, user.display_name);
    await loadCharactersAsync();
  }
};


if (__NO_DEVELOPER_RIG__ === true) {
  ravenfallService.setAuthInfo(__streamer_twitch_id, __your_twitch_id, null);
} else {
  twitch.onContext(function (context) {
    twitch.rig.log(context);
  });

  twitch.onAuthorized(function (auth) {
    ravenfallService.setAuthInfo(auth.channelId, auth.userId, auth.token);
  });
}

function scheduleNextGameStatePoll() {
  if (gamestatePollTimer && typeof gamestatePollTimer != 'undefined') {
    clearTimeout(gamestatePollTimer);
    gamestatePollTimer = undefined;
  }

  const timeout = (!!Streamer.ravenfall.session.isActive || ravenfallService.requests.serverError == true) ? 5000 : 1500;
  gamestatePollTimer = setTimeout(() => pollGameState(), timeout);
}

async function pollGameState() {
  try {

    if (!Ravenfall.isAuthenticated) {
      await ravenfallService.authenticateAsync();

      if (ravenfallService.requests.serverError == true) {
        onStateUpdated(ViewStates.BAD_SERVER_CONNECTION);
        return;
      }
    }

    const streamerInfo = await ravenfallService.getStreamerSessionAsync();
    if (streamerInfo == null && ravenfallService.requests.serverError == true) {
      onStateUpdated(ViewStates.BAD_SERVER_CONNECTION);
      return;
    }

    if (!ravenfallService.isRavenfallAvailable) {
      onStateUpdated(ViewStates.GAME_NOT_RUNNING);
      return;
    }

    if (Ravenfall.characters == null || Ravenfall.characters.length == 0) {
      await loadCharactersAsync();
    } else {
      // load current character from server so we can keep it up to date with skills, inventory, etc.
      // maybe load revisioned data and not the whole character each time?
      await requestCharacterUpdateAsync();
    }

  } catch (err) {
    console.error(err);
  } finally {
    scheduleNextGameStatePoll();
  }
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

function getCurrentSkill() {
  if (Ravenfall.character == null || Ravenfall.character.state.task == null) {
    return null;
  }

  const state = Ravenfall.character.state;
  if (state.task.toLowerCase() == 'fighting') {
    return state.taskArgument.toLowerCase();
  }
  return state.task.toLowerCase();
}

function onCharacterUpdated(character) {
  if (character == null || typeof character == 'undefined') {
    onStateUpdated(ViewStates.CHARACTER_SELECTION);
    return;
  }

  onStateUpdated(ViewStates.PLAYING);

  Ravenfall.character = character;

  characterStats.innerHTML = '';
  const currentSkill = getCurrentSkill();
  const props = Object.keys(character.skills);

  for (let prop of props) {
    if (prop.indexOf('Level') > 0) {

      try {

        const skill = prop.replace('Level', '');
        const level = character.skills[prop];
        const experience = character.skills[skill];
        const expPercent = character.skills[skill + 'Procent'];
        const skillButton = document.createElement("div");
        characterStats.appendChild(skillButton);

        const trainable = skill != 'health' && skill != 'slayer' && skill != 'sailing' ? 'can-train' : '';
        const percent = Math.floor(expPercent * 100);
        skillButton.outerHTML = characterStatsTemplate
          .replace('{trainable}', trainable)
          .replace('{SkillName}', skill)
          .replace('{SkillName}', skill)
          .replace('{SkillName}', skill)
          .replace('{SkillLevel}', level)
          .replace('{SkillExperience}', experience)
          .replace('{SkillPercent}', percent);



        // .replace('{SkillPercent}', 'width: ' + Math.floor(expPercent * 100) + '%')

        const btn = document.querySelector('.btn-' + skill);
        if (currentSkill == skill) {
          btn.classList.add("active");
          activeTaskBtn = btn;          
          btn.title = 'You\'re currently training this skill. (Level Progress '+percent+'%)';
        } else {
          btn.title = 'Click to train '+skill+' (Level Progress '+percent+'%)';
        }

        btn.querySelector('.stats-progress-value').style.width = percent + '%';
        if (trainable != '') {
          btn.addEventListener('click', () => {
            const task = getTaskBySkill(skill);
            const taskArg = getTaskArgumentBySkill(skill);
            activeTaskBtn.classList.remove("active");
            btn.classList.add("active");
            ravenfallService.setTaskAsync(task, taskArg);
            activeTaskBtn = btn;
          });
        }

      } catch (err) {
        console.error(err);
      }
    }
  }

}

function handlePlayerJoin(characterJoinResult) {
  if (characterJoinResult && characterJoinResult.success) {
    // Potential bug as we may replace the character at any time
    // we should update the array (Ravenfall.characters) 
    // and then set the character with the same reference from the characters list.
    // that way we can ensure its the same character reference later on.
    Ravenfall.character = characterJoinResult.player;
    onCharacterUpdated(Ravenfall.character);
  } else {
    // this.joinError = characterJoinResult.errorMessage;
    onStateChanged(ViewStates.GAME_JOIN_FAILED);
  }
}

function addCharacterSelectButton(character) {
  const characterSelectButton = document.createElement('div');
  characterSelectButton.classList.add('btn');
  characterSelectButton.classList.add('btn-character-select');
  characterSelectButton.character = character;
  if (character != null && typeof character != 'undefined') {
    const identifierString = character.identifier != null ? ('(<span class="character-alias">' + character.identifier + '</span>) ') : '';
    characterSelectButton.innerHTML = '<span class="character-name">' + character.name + '</span> ' + identifierString + '<span class="combat-level">Lv.' + character.combatLevel + '</span>';
  } else {
    characterSelectButton.innerHTML = 'Create new character';
  }
  characterSelectButton.addEventListener('click', async (elm) => {
    const result = await ravenfallService.joinSessionAsync(character);
    handlePlayerJoin(result);
  });
  characterList.appendChild(characterSelectButton);
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
      Ravenfall.isAuthenticated = false;
      Ravenfall.characters = null;
      Ravenfall.characterId = null;
      Ravenfall.character = null;
      characterList.innerHTML = '';
      break;

    case ViewStates.CHARACTER_SELECTION:

      if (Ravenfall.characters == null) {
        characterList.innerHTML = 'Loading...';
      } else {
        characterList.innerHTML = '';
        Ravenfall.characters.forEach(x => {
          addCharacterSelectButton(x);
        });
        if (3 - Ravenfall.characters.length > 0) {
          addCharacterSelectButton(null);
        }
      }
      break;
    case ViewStates.GAME_JOIN_FAILED:
      writeDebugText('Joined failed. ' + ravenfallService.joinError, true);
      break;

    case ViewStates.GAME_NOT_RUNNING:
      // streamer does not have an active game session
      break;
    case ViewStates.ANONYMOUS_USER:
      // viewer has to accept extension permissions and share identity for this to work.
      break;
    case ViewStates.NO_USER_ACCOUNT:
      // User has no account. Ask them if they want to create one
      // createNewUserAccount
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
  extension.classList.remove('hidden');
  extensionToggleButton.classList.add('hidden');
});

extensionCloseButton.addEventListener('click', () => {
  extension.classList.add('hidden');
  extensionToggleButton.classList.remove('hidden');
});

leaveGameBtn.addEventListener('click', async () => {
  await ravenfallService.leaveSessionAsync();
  onCharacterUpdated(null);
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