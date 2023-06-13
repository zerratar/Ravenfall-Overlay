import RavenfallExtension from "../extension.js";
import {
    SubView
} from "./BaseViews.js";

export class CharacterSelectionView extends SubView {
    constructor(parentView) {
        super(parentView, 'character-selection');
        Views.characterSelection = this;
    }

    addCharacterSelectButton(character) {

        const characterList = this.element.querySelector('.character-list');
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

            const result = await Ravenfall.service.joinSessionAsync(character);

            if (result && result.success) {
                // Potential bug as we may replace the character at any time
                // we should update the array (Ravenfall.characters) 
                // and then set the character with the same reference from the characters list.
                // that way we can ensure its the same character reference later on.
                // Ravenfall.character = characterJoinResult.player;
                // onCharacterUpdated(Ravenfall.character)
                console.log("Yay, player joined the game!");                
            } else {
                console.error("Failed to join game :<");
            }

            // else {
            //     // this.joinError = characterJoinResult.errorMessage;
            //     onStateChanged(ViewStates.GAME_JOIN_FAILED);
            // }
        });
        characterList.appendChild(characterSelectButton);
    }


    update() {
        // Update the character selection view
        // rebuild the view if necessary.
        console.log('rebuild character selection view requested');

        const characterList = this.element.querySelector('.character-list');
        if (Ravenfall.characters == null) {
            characterList.innerHTML = 'Loading...';
        } else {
            characterList.innerHTML = '';
            Ravenfall.characters.forEach(x => {
                this.addCharacterSelectButton(x);
            });
            // when added as "null", we will just add
            // a button that says "create character".
            // If we have 1 or more character slots remaining
            // we can create a new character.
            if (maximum_allowed_characters - Ravenfall.characters.length > 0) {
                this.addCharacterSelectButton(null);
            }
        }

    }
}