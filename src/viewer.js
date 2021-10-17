import TwitchService from "./modules/twitch-service.js";
import RavenfallService from "./modules/ravenfall-service.js";

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
const extension = document.querySelector('.extension');
const extensionDarkMode = document.querySelector('.btn-toggle-dark-mode');
const extensionViews = document.querySelectorAll('.view');
const extensionToggleButton = document.querySelector('.extension-toggle');
const extensionCloseButton = document.querySelector('.btn-close-panel');
const characterStats = document.querySelector('.character-stats');

// todo(zerratar): replace to use actual <template></template>
const characterStatsTemplate = document.querySelector('.character-stat').outerHTML;
characterStats.innerHTML = '';

const createAccountBtn = document.querySelector('.btn-create-account');
const characterList = document.querySelector('.character-list');
const leaveGameBtn = document.querySelector('.btn-leave-game');

const storage = window.localStorage;
const toggleDarkTheme = () => {
  if (extension.classList.contains('dark-theme')) {
    extension.classList.remove('dark-theme');
    extensionDarkMode.innerHTML = '&blk34;';
    storage.removeItem('rf-theme');
  } else {
    extension.classList.add('dark-theme');
    extensionDarkMode.innerHTML = '&blk14;';
    storage.setItem('rf-theme', 'dark-theme');
  }
}

let loadedTheme = storage.getItem('rf-theme');
if (loadedTheme != null) {
  toggleDarkTheme();
} else {
  // Note(zerratar): For some reason the "Toggle dark mode" button is rendered
  //                 in the wrong place. calling the toggleDarkTheme seem to fix it.
  //                 but since we dont want to enforce an inverted change we will toggle it twice.
  //
  //  << You can try and comment these two lines and check the behaviour. Technically it adds the 
  //     dark theme style and update the content then reverts it back by removing the style 
  //     and change back the content. For some reason, this seem to fix the weird thing. >>
  toggleDarkTheme();
  toggleDarkTheme();
}

if (__NO_DEVELOPER_RIG__ === false) {
  const twitch = window.Twitch.ext;
  window.console.log = twitch.rig.log;
}

// Current ViewState can always be changed in case
// server goes down or user leaves the game, etc.
// however, we will need a sub state to keep track
// on things like what tab the player is on; 
// training, crafting, market, overview, inventory, etc

var currentState = ViewStates.NONE;

const twitchService = new TwitchService();
const ravenfallService = new RavenfallService(x => onCharacterUpdated(x));

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

  
  { // DEBUG
    const sessionInfo = JSON.stringify(ravenfallService.sessionInfo);
    console.log('Authenticated with ravennest: ' + sessionInfo);
  } // END DEBUG
  

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
  // note(zerratar): auth token must be set in production
  ravenfallService.setAuthInfo(__streamer_twitch_id, __your_twitch_id, null);
} else {
  twitch.onContext(function (context) {
    twitch.rig.log(context);
  });

  twitch.onAuthorized(function (auth) {
    ravenfallService.setAuthInfo(auth.channelId, auth.userId, auth.token);
  });
}

function clearGameStatePollTimeout() {
  if (gamestatePollTimer && typeof gamestatePollTimer != 'undefined') {
    clearTimeout(gamestatePollTimer);
    gamestatePollTimer = undefined;
  }
}

function scheduleNextGameStatePoll() {
  clearGameStatePollTimeout();
  const timeout = (extension.classList.contains('hidden') || !!Streamer.ravenfall.session.isActive || ravenfallService.requests.serverError == true) ? 5000 : 1000;
  gamestatePollTimer = setTimeout(() => pollGameState(), timeout);
}

async function pollGameState() {
  try {
    // in case we call this to force a poll game state right away.
    // we want to clear the already scheduled state poll.
    clearGameStatePollTimeout();

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

  // template should be used here, and once the buttons has been created
  // do not recreate them like we do below. Instead just update the content
  // Updating content is much faster than recreating the dom elements. + much 
  // easier to work with when styling up.... 
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

        const canTrainClass = skill != 'health' && skill != 'slayer' && skill != 'sailing' ? 'can-train' : '';
        const canTrain = canTrainClass != '';
        const percent = Math.floor(expPercent * 100);
        skillButton.outerHTML = characterStatsTemplate
          .replace('{trainable}', canTrainClass)
          .replace('{SkillName}', skill)
          .replace('{SkillName}', skill)
          .replace('{SkillName}', skill)
          .replace('{SkillLevel}', level)
          .replace('{SkillExperience}', experience)
          .replace('{SkillPercent}', percent);


        const btn = document.querySelector('.btn-' + skill);
        if (currentSkill == skill) {
          btn.classList.add("active");
          btn.title = 'You\'re currently training this skill. (Level Progress ' + percent + '%)';
          activeTaskBtn = btn;
        } else {
          btn.title =  canTrain 
            ? 'Click to train ' + skill + ' (Level Progress ' + percent + '%)'
            : skill + ' (Level Progress ' + percent + '%)';
        }

        btn.querySelector('.stats-progress-value').style.width = percent + '%';

        if (canTrain) {
          btn.addEventListener('click', () => {
            btn.classList.add("active");
            activeTaskBtn.classList.remove("active");
            activeTaskBtn = btn;

            ravenfallService.setTaskAsync(getTaskBySkill(skill), getTaskArgumentBySkill(skill));
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
  // Maybe break this out to use a <template></template>
  // in the video_overlay.html file. And once created do not recreate it just replace the content.
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
    // todo(zerratar): handle this differently maybe?
    //                 this is the only place were we don't update the
    //                 state from within the ravenfallService but instead
    //                 update it from here. (handlePlayerJoin)
    //                 We should have as few places as possible that does this
    //                 to avoid any bugs
    
    onStateUpdated(ViewStates.JOINING_GAME);

    const result = await ravenfallService.joinSessionAsync(character);
    handlePlayerJoin(result);
  });
  characterList.appendChild(characterSelectButton);
}

function onStateUpdated(newState) {
  currentState = newState;

  // clear out the "active" class on the old view and set it on the new one
  // this toggles which "view" that is visible in the video_overlay.html
  extensionViews.forEach(elm => {
    if (elm.dataset.name === currentState) {
      elm.classList.add('active');
    } else {
      elm.classList.remove('active');
    }
  });

  switch (currentState) {

    // Whenever we do a request to RavenNest and the request gives us an error
    // unrelated to API usage, but things like server unreachable, etc.
    case ViewStates.BAD_SERVER_CONNECTION:
      // note(zerratar): changing the RF state should not be
      //                 handeled here. it would be better to
      //                 have this in the RavenfallService
      //                 whenever we are unable to do a web req

      Ravenfall.isAuthenticated = false;
      Ravenfall.characters = null;
      Ravenfall.characterId = null;
      Ravenfall.character = null;

      // todo(zerratar): update to not clear out the
      // whole list but re-use same elements instead.
      characterList.innerHTML = '';
      break;

    // this is triggered if we do not have a player selected and 
    // characters being loaded or have been loaded from the server.
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

    // this is triggered by the join request if for any reason player fails to be added
    // this could be if you do not have permission to add the particular player, player
    // does not exist or cannot create an additional character. Should not happen from
    // the extension as you have buttons for these things. 
    // So we will display it as an unknown error instead.
    case ViewStates.GAME_JOIN_FAILED:
      // writeDebugText('Joined failed. ' + ravenfallService.joinError, true);
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
  extension.classList.remove('hidden');
  extensionToggleButton.classList.add('hidden');
  pollGameState();
});

extensionCloseButton.addEventListener('click', () => {
  extension.classList.add('hidden');
  extensionToggleButton.classList.remove('hidden');
});

leaveGameBtn.addEventListener('click', async () => {
  await ravenfallService.leaveSessionAsync();
  onCharacterUpdated(null);
});

createAccountBtn.addEventListener('click', () => {
  createNewUserAccount();
});

/*
  Make the toggle button draggable
*/

dragElement(document.getElementById("extension-toggle"));

pollGameState();