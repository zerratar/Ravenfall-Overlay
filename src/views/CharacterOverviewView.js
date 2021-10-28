import { SubView } from "./BaseViews.js";

export class CharacterOverviewView extends SubView {
    constructor(parentView) {
        super(parentView, 'character-overview');
        const leaveGameBtn = document.querySelector('.btn-leave-game');
        
        leaveGameBtn.addEventListener('click', async () => {
            await Ravenfall.service.leaveSessionAsync();
            Ravenfall.extension.onCharacterUpdated(null);
        });
    }

    onCharacterUpdated(character) {}
}
