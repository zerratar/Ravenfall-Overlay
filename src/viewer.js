var krakenUsersApi = 'https://api.twitch.tv/kraken/users/';
// var ravenfallApiUrl = 'https://localhost:5001/api/';
var ravenfallApiUrl = 'https://www.ravenfall.stream/api/';
var authApi = ravenfallApiUrl + 'auth';
var twitchApi = ravenfallApiUrl + 'twitch';
var extensionApi = twitchApi + '/extension';
var playersApi = ravenfallApiUrl + 'players';
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

var states = {
  NONE: 'NONE',
  TWITCH_AUTH_OK: 'TWITCH_AUTH_OK',
  WAIT_FOR_GAME: 'WAIT_FOR_GAME',
  GAME_NOT_RUNNING: 'GAME_NOT_RUNNING',
  AUTHENTICATING: 'AUTHENTICATING',
  ANONYMOUS_USER: 'ANONYMOUS_USER',
  NO_USER_ACCOUNT: 'NO_USER_ACCOUNT',
  ALL_AUTH_OK: 'ALL_AUTH_OK',

  LOADING_CHARACTERS: 'LOADING_CHARACTERS',
  CHARACTERS_LOADED: 'CHARACTERS_LOADED',

  JOINING_GAME: 'JOINING_GAME',
  GAME_JOINED: 'GAME_JOINED',
  GAME_JOIN_FAILED: 'GAME_JOIN_FAILED',

  BAD_SERVER_CONNECTION: 'BAD_SERVER_CONNECTION'
};

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

toggleDarkTheme();
toggleDarkTheme();

const twitch = window.Twitch.ext;
window.console.log = twitch.rig.log;

var currentState = states.NONE;

class Requests {
  constructor() {
    this.sessionId = '';
    this.serverError = false;
  }

  async getAsync(uri) {
    try {
      const data = await fetch(uri, {
        method: 'GET',
        headers: new Headers({
          '__ravenSession': this.sessionId
        })
      });
      const json = data.json();
      this.serverError = false;
      return json;
    } catch (err) {
      this.serverError = true;
      return null;
    }
  }
}

class TwitchService {
  constructor(req) {
    this.requests = req;
    this.users = {};
  }
  async getTwitchUser(userId) {
    if (typeof this.users[userId] != undefined)
      return this.users[userId];
    return (this.users[userId] = await this.requests.getAsync(krakenUsersApi + '/' + userId));
  }
}

class RavenfallService {
  constructor(req) {
    this.requests = req;
    this.isAuthenticated = false;
    this.twitchUserId = '';
    this.token = '';
    this.broadcasterId = '';
    this.sessionInfo = undefined;
    this.streamerInfo = undefined;
    this.activeCharacter = undefined;
    this.joinError = ''
  }

  get isRavenfallAvailable() {
    return !!this.streamerInfo && this.streamerInfo.isRavenfallRunning;
  }

  setAuthInfo(broadcasterId, twitchUserId, token) {
    this.broadcasterId = broadcasterId;
    this.twitchUserId = twitchUserId;
    this.token = token;
  }

  async authenticateAsync() {
    if (this.isAuthenticated === true) {
      return;
    }

    onStateUpdated(states.AUTHENTICATING);
    this.sessionInfo = await this.requests.getAsync(extensionApi + '/' + this.broadcasterId + '/' + this.twitchUserId);
    this.isAuthenticated = !!this.sessionInfo;
    if (this.isAuthenticated) {
      this.requests.sessionId = this.sessionInfo.sessionId;
    }
  }

  async getStreamerSessionAsync() {
    if (this.requests.serverError == false && this.streamerInfo == null) {
      onStateUpdated(states.WAIT_FOR_GAME);
    }

    this.streamerInfo = await this.requests.getAsync(extensionApi + '/' + this.broadcasterId);
  }

  async createUserAsync(userName, displayName) {
    onStateUpdated(states.WAIT_FOR_GAME);
    this.sessionInfo = await this.requests.getAsync(extensionApi + '/new/' + this.broadcasterId + '/' + this.twitchUserId + '/' + userName + '/' + encodeURIComponent(displayName));
  }

  async getCharactersAsync() {
    onStateUpdated(states.LOADING_CHARACTERS);
    this.characters = await this.requests.getAsync(playersApi + '/all');
    onStateUpdated(states.CHARACTERS_LOADED);
  }

  async setTaskAsync(task, taskArgument) {
    if (this.activeCharacter == null || typeof this.activeCharacter == undefined) {
      return;
    }

    let taskData = task;
    if (taskArgument != null && taskArgument.length > 0) {
      taskData += '/' + taskArgument;
    }

    await this.requests.getAsync(extensionApi + '/set-task/' + this.broadcasterId + '/' + this.activeCharacter.id + '/' + taskData);
    this.activeCharacter.state.task = task;
    this.activeCharacter.state.taskArgument = taskArgument;
    onTaskUpdated();
  }

  async leaveSessionAsync() {
    if (this.activeCharacter != null && await this.requests.getAsync(extensionApi + '/leave/' + this.broadcasterId + '/' + this.activeCharacter.id)) {
      this.characters = await this.requests.getAsync(playersApi + '/all');
    }
    this.activeCharacter = null;
    onStateUpdated(states.CHARACTERS_LOADED);
  }

  async joinSessionAsync(character) {
    onStateUpdated(states.JOINING_GAME);
    this.joinError = '';
    const characterJoinResult = await this.requests.getAsync(extensionApi + '/join/' + this.broadcasterId + '/' + character.id);
    if (characterJoinResult.success) {
      this.activeCharacter = characterJoinResult.player;
      onCharacterSkillsUpdated();
      onStateUpdated(states.GAME_JOINED);
    } else {
      this.joinError = characterJoinResult.errorMessage;
      onStateUpdated(states.GAME_JOIN_FAILED);
    }
  }
}
const req = new Requests();
const twitchService = new TwitchService(req);
const ravenfall = new RavenfallService(req);

const writeDebugText = (text, clear) => {
  const before = clear === true ? '' : $('.debug-info').html();
  $('.debug-info').html(before + ' ' + text);
};

const scheduleStreamerSessionInfo = function () {
  const timeout = (!!ravenfall.streamerInfo || ravenfall.requests.serverError == true) ? 5000 : 1500;
  setTimeout(() => ravenfall.getStreamerSessionAsync().then(() => onStreamerInfoUpdated()), timeout);
}

const onStreamerInfoUpdated = () => {

  if (ravenfall.streamerInfo == null && ravenfall.requests.serverError == true) {
    onStateUpdated(states.BAD_SERVER_CONNECTION);
    scheduleStreamerSessionInfo();
    return;
  }

  // const streamerInfo = JSON.stringify(ravenfall.streamerInfo);
  // writeDebugText(streamerInfo);
  // $('.debug-info').html(streamerInfo);
  if (!ravenfall.isRavenfallAvailable) {
    onStateUpdated(states.GAME_NOT_RUNNING);
    scheduleStreamerSessionInfo();
  }

  if (ravenfall.isRavenfallAvailable &&
    ravenfall.isAuthenticated &&
    ((ravenfall.activeCharacter == null &&
        (ravenfall.characters == null || ravenfall.characters.length == 0)) ||
      currentState == states.BAD_SERVER_CONNECTION)) {
    onStateUpdated(states.ALL_AUTH_OK);
  } else if (!ravenfall.isAuthenticated) {
    ravenfall.authenticateAsync().then(() => onRavenfallAuth());
  }
};

const onRavenfallAuth = () => {
  if (ravenfall.sessionInfo == null) {
    // failed to authenticate    
    // user probably does not exist.
    // so we will try and get the twitch user info
    twitch.rig.log('Failed to authenticate with ravenfall. Most likely has no user.');
    if (!ravenfall.twitchUserId.toLowerCase().startsWith('u')) {
      onStateUpdated(states.ANONYMOUS_USER);
    } else {
      onStateUpdated(states.NO_USER_ACCOUNT);
    }
    return;
  }

  const sessionInfo = JSON.stringify(ravenfall.sessionInfo);
  twitch.rig.log('Authenticated with ravennest: ' + sessionInfo);

  // writeDebugText(sessionInfo);

  if (ravenfall.isRavenfallAvailable) {
    onStateUpdated(states.ALL_AUTH_OK);
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

twitch.onContext(function (context) {
  twitch.rig.log(context);
});

if (__NO_DEVELOPER_RIG__) {
	  onStateUpdated(states.TWITCH_AUTH_OK);
	  ravenfall.setAuthInfo(__streamer_twitch_id, __your_twitch_id, null);
	  ravenfall.getStreamerSessionAsync().then(() => onStreamerInfoUpdated());	
}
else {
	twitch.onAuthorized(function (auth) {
	  onStateUpdated(states.TWITCH_AUTH_OK);

	  ravenfall.setAuthInfo(auth.channelId, auth.userId, auth.token);
	  ravenfall.getStreamerSessionAsync().then(() => onStreamerInfoUpdated());
	});
}
const pollGameState = () => {
  if (gamestatePollTimer && typeof gamestatePollTimer != undefined) {
    clearTimeout(gamestatePollTimer);
    gamestatePollTimer = undefined;
  }

  scheduleStreamerSessionInfo();
  gamestatePollTimer = setTimeout(() => pollGameState(), 5000);
};

function onTaskUpdated() {
  if (ravenfall.activeCharacter == null || typeof ravenfall.activeCharacter == undefined) {
    return;
  }

  console.log('New Task: ' + ravenfall.activeCharacter.state.task + ', ' + ravenfall.activecharacter.state.taskArgument);
}

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

function onCharacterSkillsUpdated() {
  if (ravenfall.activeCharacter == null || typeof ravenfall.activeCharacter == undefined) {
    return;
  }

  characterStats.innerHTML = '';
  const props = Object.keys(ravenfall.activeCharacter.skills);
  for (let prop of props) {
    if (prop.indexOf('Level') > 0) {
      const skill = prop.replace('Level', '');
      const level = ravenfall.activeCharacter.skills[prop];
      const experience = ravenfall.activeCharacter.skills[skill];
      const skillButton = document.createElement("div");
      characterStats.appendChild(skillButton);

      const trainable = skill != 'slayer' && skill != 'sailing' ? 'can-train' : '';

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

    case states.BAD_SERVER_CONNECTION:
      ravenfall.characters = null;
      ravenfall.activeCharacter = null;
      characterList.innerHTML = '';
      break;

    case states.CHARACTERS_LOADED:
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

      pollGameState();
      break;
    case states.GAME_JOIN_FAILED:
      writeDebugText('Joined failed. ' + ravenfall.joinError, true);
      break;
    case states.ALL_AUTH_OK:
      ravenfall.getCharactersAsync();
      // everything is OK!
      // this is when the actual extension should be completely initialized.
      break;
    case states.TWITCH_AUTH_OK:
      // after recieving an OK from twitch.
      break;
    case states.AUTHENTICATING:
      // when authenticating with ravenfall website
      break;
    case states.WAIT_FOR_GAME:

      break;
    case states.GAME_NOT_RUNNING:
      // streamer does not have an active game session
      break;
    case states.ANONYMOUS_USER:
      // viewer has to accept extension permissions and share identity for this to work.
      break;
    case states.NO_USER_ACCOUNT:
      // User has no account. Ask them if they want to create one
      break;
    case states.GAME_JOINED:
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