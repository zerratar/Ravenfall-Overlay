import { SubView } from "./BaseViews.js";

export class CharacterOverviewView extends SubView {
    constructor(parentView) {
        super(parentView, 'character-overview');

        this.activeCharacter = null;

        this.container = document.querySelector('.character-details');
        this.btnJoinRaid = document.querySelector('.btn-join-raid');
        this.btnJoinDungeon = document.querySelector('.btn-join-dungeon');
        this.btnBeginRest = document.querySelector('.btn-begin-rest');
        this.btnEndRest = document.querySelector('.btn-end-rest');


        this.restedTimeLeft = document.querySelector('.rested-time .time');

        this.combatLevel = document.querySelector('.character-combat-level');

        this.characterName = {
            username: document.querySelector('.character-name .username'),
            index: document.querySelector('.character-name .index'),
            alias: document.querySelector('.character-name .alias'),
        };

        this.resources = {
            coins: document.querySelector('.resource.coins .resource-value'),
            wood: document.querySelector('.resource.wood .resource-value'),
            ore: document.querySelector('.resource.ore .resource-value'),
            fish: document.querySelector('.resource.fish .resource-value'),
            wheat: document.querySelector('.resource.wheat .resource-value'),
        };

        this.training = {
            name: document.querySelector('.training-skill-name'),
            level: document.querySelector('.training-skill-level'),
            progress: {
                fill: document.querySelector('.training-skill-progress-fill'),
                value: document.querySelector('.training-skill-progress-percent'),
            },
            timeForLevel: document.querySelector('.training-skill-time-for-level'),
            expPerHour: document.querySelector('.training-skill-rate'),
        };

        this.dungeon = {
            name: document.querySelector('.dungeon-name'),
            level: document.querySelector('.dungeon-level'),
            secondsLeft: document.querySelector('.dungeon-seconds-starts'),
            enemiesLeft: document.querySelector('.dungeon-enemies-left'),
            playersLeft: document.querySelector('.dungeon-players-left'),
            
            health: {
                currentValue: 0,
                maxValue: 0,
                percent:1,
                fill: document.querySelector('.dungeon-status .health-progress-fill'),
                value: document.querySelector('.dungeon-status .health-progress-value'),
            }
        };

        this.raid = {
            level: document.querySelector('.raid-level'),
            secondsLeft: document.querySelector('.raid-seconds-left'),
            health: {
                currentValue: 0,
                maxValue: 0,
                percent:1,
                fill: document.querySelector('.raid-status .health-progress-fill'),
                value: document.querySelector('.raid-status .health-progress-value'),
            }
        };

        this.btnJoinRaid.addEventListener('click', async () => {
            await Ravenfall.service.joinRaidAsync();
            // onGameStateUpdated is not necessary to trigger, but it will make the changes immediate
            this.onGameStateUpdated(Ravenfall.gameState);
        });

        this.btnJoinDungeon.addEventListener('click', async () => {
            await Ravenfall.service.joinDungeonAsync();
            this.onGameStateUpdated(Ravenfall.gameState);
        });

        this.btnBeginRest.addEventListener('click', async () => {
            await Ravenfall.service.enterOnsenAsync();
            this.onGameStateUpdated(Ravenfall.gameState);
        });

        this.btnEndRest.addEventListener('click', async () => {
            await Ravenfall.service.exitOnsenAsync();
            this.onGameStateUpdated(Ravenfall.gameState);
        });


        Views.overview = this;
    }

    updateCharacterDetails(character) {
        let isRested = character.state.restedTime > 0;
        let isTrainingAll = character.state.taskArgument != null && (character.state.taskArgument.toLowerCase() === 'all' || character.state.taskArgument.toLowerCase() === 'health');
        let onFerry = character.state.onFerry === true || character.state.island === null || character.state.island === 'Ferry';
        let isCaptain = character.state.isCaptain === true;

        this.container.classList.toggle('is-training', character.state.taskArgument != null && character.state.taskArgument.length > 0);
        this.container.classList.toggle('is-training-all', isTrainingAll);
        this.container.classList.toggle('is-rested', isRested);
        this.container.classList.toggle('is-captain', isCaptain);

        this.container.classList.toggle('in-dungeon', character.state.inDungeon === true || character.state.joinedDungeon === true);
        this.container.classList.toggle('in-raid', character.state.inRaid === true);
        this.container.classList.toggle('in-duel', character.state.inDuel === true);
        this.container.classList.toggle('in-arena', character.state.inArena === true);
        this.container.classList.toggle('on-ferry', onFerry);

        this.combatLevel.innerText = character.combatLevel;
        this.characterName.username.innerText = character.name;
        this.characterName.alias.innerText = character.alias;
        this.characterName.index.innerText = '#' + character.characterIndex;
        this.restedTimeLeft.innerText = formatTimeShort(character.state.restedTime);

        this.updateResources(character);
        this.updateTraining(character);
        this.updateRaid();
        this.updateDungeon();
    }

    onExpUpdated(data) {
        this.updateTraining(this.activeCharacter);
    }

    updateRaid() {
        const dateEnds = new Date(Ravenfall.gameState.raid.endTime);
        const nextRaid = new Date(Ravenfall.gameState.raid.nextRaid);

        let timeNow = new Date();
        let raidEndsSeconds = (dateEnds-timeNow) / 1000; // into seconds

        this.raid.level.innerText = Ravenfall.gameState.raid.bossCombatLevel;
        this.raid.secondsLeft.innerText = Math.floor(raidEndsSeconds)  + ' seconds left';//this.formatTime();
        this.raid.health.fill.style.width = this.raid.health.percent * 100 + '%';
        this.raid.health.value.innerText = formatAmount(this.raid.health.currentValue) + ' / ' + formatAmount(this.raid.health.maxValue);
    }

    updateDungeon() {
        const dateStart = new Date(Ravenfall.gameState.dungeon.startTime);
        const nextDungeon = new Date(Ravenfall.gameState.dungeon.nextDungeon);
        let timeNow = new Date();
        let dungeonStartsSeconds = (dateStart-timeNow) / 1000; // into seconds

        this.dungeon.enemiesLeft.innerText = Ravenfall.gameState.dungeon.enemiesLeft;

        if (Ravenfall.gameState.dungeon.hasStarted === true) {
            this.dungeon.playersLeft.innerText = Ravenfall.gameState.dungeon.playersAlive + "/" + Ravenfall.gameState.dungeon.playersJoined;
        } else {
            this.dungeon.playersLeft.innerText = Ravenfall.gameState.dungeon.playersJoined;
        }

        this.dungeon.name.innerText = Ravenfall.gameState.dungeon.name;
        this.dungeon.level.innerText = Ravenfall.gameState.dungeon.bossCombatLevel;
        this.dungeon.secondsLeft.innerText = dungeonStartsSeconds > 0 ? (Math.floor(dungeonStartsSeconds) + 's') : '';//this.formatTime();
        this.dungeon.health.fill.style.width = this.dungeon.health.percent * 100 + '%';
        this.dungeon.health.value.innerText = formatAmount(this.dungeon.health.currentValue) + ' / ' + formatAmount(this.dungeon.health.maxValue);
    }

    updateResources(character) {
        this.resources.coins.innerText = formatAmount(character.resources.coins);
        this.resources.wood.innerText = formatAmount(character.resources.wood);
        this.resources.ore.innerText = formatAmount(character.resources.ore);
        this.resources.wheat.innerText = formatAmount(character.resources.wheat);
        this.resources.fish.innerText = formatAmount(character.resources.fish);
    }

    updateTraining(character) {
        var isTrainingAll = character.state.taskArgument != null 
            && (character.state.taskArgument.toLowerCase() === 'all' || character.state.taskArgument.toLowerCase() === 'health');

        if (character.state.taskArgument != null) {
            const skillNameLower = character.state.taskArgument.toLowerCase();

            if (isTrainingAll) { 
                let html = 'All (Atk / Def / Str)\n';
                html += 'Level: <span class="training-all attack-level">' + character.skills.attackLevel + '</span> / <span class="training-all defense-level">' + character.skills.defenseLevel + '</span> / <span class="training-all strength-level">' + character.skills.strengthLevel + '</span>';
                this.training.name.innerHTML = html;
            } else {
                this.training.name.innerText = character.state.taskArgument;
                this.training.level.innerText = character.skills[skillNameLower + 'Level'];
                
                const currentExp = character.skills[skillNameLower];
                const currentProgress = character.skills[skillNameLower + 'Procent'];
                const percent = Math.floor(currentProgress * 100);

                this.training.progress.fill.style.width = percent + '%';
                this.training.progress.value.title = formatExp(currentExp) + " XP";
                this.training.progress.value.innerText = '('+percent + '%)';
            }

            // character.state.estimatedTimeForLevelUp is in UTC format from C# DateTime.UtcNow
            // 2023-06-13T09:59:35.152837Z
            // need to transform it into a Date object and then format it

            let timeForLevel = new Date(character.state.estimatedTimeForLevelUp);
            let timeNow = new Date();
            let diff = (timeForLevel-timeNow) / 1000; // into seconds

            this.training.timeForLevel.innerText = this.formatTimeLeftForLevel(diff);
            let expPerHour = character.state.expPerHour;            
            let formattedExpPerHour= formatExp(expPerHour);
            let noExpGain = false;

            if (formattedExpPerHour == 0) {
                this.training.expPerHour.innerText = 'Not gaining exp';
                noExpGain = true;
            } else {
                this.training.expPerHour.innerText = formatExp(character.state.expPerHour) + ' XP/H';
            }
            this.training.expPerHour.classList.toggle('no-exp-gain', noExpGain);
        }
    }

    formatTimeLeftForLevel(totalSeconds) {

        if (totalSeconds < 0) {
            return "Unknown";
        }

        if (totalSeconds < 60) {
            return Math.floor(totalSeconds) + " seconds";
        }

        let seconds = Math.floor(totalSeconds % 60);
        let totalMinutes = Math.floor(totalSeconds / 60);
        if (totalMinutes < 60) {
            if (seconds == 0) {
                return totalMinutes + " mins";    
            }
            return totalMinutes + " mins, " +  seconds + " seconds";
        }

        let minutes = (totalMinutes % 60);
        let totalHours = Math.floor(totalMinutes / 60);
        if (totalHours < 24) {
            if (minutes == 0) { 
                return totalHours + " hours";
            }
            return totalHours + " hours, " + minutes + " mins";
        }

        let hours = Math.floor(totalHours % 24);
        let totalDays = Math.floor(totalHours / 24);
        if (totalDays <= 30) { 
            if (hours == 0) {
                return totalDays + " days";
            }
            return totalDays + " days, " + hours + " hours";
        }

        // if (totalDays <= 14) { 
        //     return "2 weeks";
        // }
        
        // if (totalDays <= 21) { 
        //     return "2-3 weeks";
        // }

        if (totalDays < 1000) {
            return totalDays + " days";
        }

        return "unknown";
    }

    onRestedUpdated(character, rested) {
        if (this.activeCharacter == null) {
            this.activeCharacter = character;
        }

        this.updateCharacterDetails(character);
    }

    onCharacterUpdated(character) {
        this.activeCharacter = character;
        this.updateCharacterDetails(character);
    }

    onGameStateUpdated(gameState) {
        if (this.activeCharacter == null) {
            this.activeCharacter = Ravenfall.service.getActiveCharacter();
        }

        if (this.activeCharacter == null) {
            return null;
        }

        var inDungeon = this.activeCharacter.state.inDungeon === true;
        var inEvent = this.activeCharacter.state.inRaid === true || inDungeon
            || this.activeCharacter.state.inDuel === true
            || this.activeCharacter.state.inArena === true
            || this.activeCharacter.state.joinedDungeon === true;

        var dungeonBossLocked = gameState.dungeon.enemiesLeft > 0;
        var resting = this.activeCharacter.state.inOnsen === true;
        var canRest = !resting && !inEvent && (this.activeCharacter.state.island != null && (this.activeCharacter.state.island.toLowerCase() == "kyo" || this.activeCharacter.state.island.toLowerCase() == "heim"));
        var isRested = this.activeCharacter.state.restedTime > 0;

        this.container.classList.toggle('is-rested', isRested);
        this.container.classList.toggle('is-resting', resting);
        this.container.classList.toggle('can-rest', canRest);

        this.container.classList.toggle('raid-active', gameState.raid.isActive === true);
        this.container.classList.toggle('dungeon-active', gameState.dungeon.isActive === true);
        this.container.classList.toggle('dungeon-started', gameState.dungeon.hasStarted === true);
        this.container.classList.toggle('can-join-dungeon', inEvent === false && gameState.dungeon.isActive === true && gameState.dungeon.hasStarted === false);        
        this.container.classList.toggle('dungeon-boss-locked', dungeonBossLocked);

        let raidBossHealthPercent = 0;
        if (gameState.raid.isActive === true) {
            raidBossHealthPercent = gameState.raid.currentBossHealth / gameState.raid.maxBossHealth;
            this.raid.health.currentValue = gameState.raid.currentBossHealth;
            this.raid.health.maxValue = gameState.raid.maxBossHealth;
            this.raid.health.percent=raidBossHealthPercent;
        }

        if (gameState.dungeon.hasStarted === true && inDungeon === true) {
            this.dungeon.health.currentValue = gameState.dungeon.currentBossHealth;
            this.dungeon.health.maxValue = gameState.dungeon.maxBossHealth;
            this.dungeon.health.percent= gameState.dungeon.currentBossHealth / gameState.dungeon.maxBossHealth;
        }

        this.container.classList.toggle('can-join-raid', !inEvent && gameState.raid.isActive && raidBossHealthPercent > 0.1);
        this.updateCharacterDetails(this.activeCharacter);
    }
}