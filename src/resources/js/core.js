let useDevServer = false; // Change this to true when running Dev Nest Locally.

let ravenfallHost = 'www.ravenfall.stream';

if (useDevServer) {
    ravenfallHost = 'localhost:5001';
}

let ravenfallUrl = 'https://' + ravenfallHost + '/';
let ravenfallApiUrl = ravenfallUrl + 'api/';
let extensionApi = ravenfallApiUrl + 'twitch/extension';
let itemsApi = ravenfallApiUrl + 'items';
let playersApi = ravenfallApiUrl + 'players';

let ravenfallWebsocketApiUrl = 'wss://' + ravenfallHost + '/api/stream/extension';

let krakenUsersApi = 'https://api.twitch.tv/kraken/users';

let skillNames = [
    'attack',
    'defense',
    'strength',
    'health',
    'woodcutting',
    'fishing',
    'mining',
    'crafting',
    'cooking',
    'farming',
    'slayer',
    'magic',
    'ranged',
    'sailing',
    'healing',
    'gathering',
    'alchemy'
];

let island = [
    'Ferry',
    'Home',
    'Away',
    'Ironhill',
    'Kyo',
    'Heim',
    'Atria',
    'Eldara'
];

let characterState = [
    'None',
    'Raid',
    'Arena',
    'Dungeon',
    'Onsen',
    'Duel',
    'StreamRaidWar',
    'JoinedDungeon'
];

let ExpValuePostfix = [' ', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'R', 'Q'];
let AmountPostFix = ['', 'K', 'M', 'B', 'T', 'Q'];

function formatValue(value, postfix, secondary = "Q") {
    let thousands = 0;
    while (value > 1000) {
        value = (value / 1000);
        thousands++;
    }
    if (thousands == 0) {
        return value;
    }
    const pLen = postfix.length - 1;
    const p0 = ((thousands - 1) % pLen) + 1;
    const q = thousands >= pLen ? secondary : "";
    return value.toFixed(1) + postfix[0] + postfix[p0] + q;
}

function formatExp(amount) {
    return formatValue(amount, AmountPostFix, "");//ExpValuePostfix);
}

function formatAmount(amount) {
    return formatValue(amount, AmountPostFix, "");
}

function nonformatFormatAmount(amount) {
    return amount.toLocaleString("en-US");
}

function formatTimeShort(totalSeconds) {
    if (totalSeconds < 60) {
        return Math.floor(totalSeconds) + "s";
    }
    const totalMinutes = Math.floor(totalSeconds / 60);
    if (totalMinutes < 60) {
        return totalMinutes + "m";
    }

    const totalHours = Math.floor(totalMinutes / 60);
    return totalHours + "h+";
}