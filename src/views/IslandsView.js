import { SubView } from "./BaseViews.js";


export class IslandsView extends SubView {
    constructor(parentView) {
        super(parentView, 'islands');
        
        this.destinationIsland = null;
        this.activeIsland = null;
        this.islandBlocks = document.querySelectorAll('.island');
        this.islands = [];
        for(const island of this.islandBlocks) {
            const actionButton = island.querySelector('.btn.btn-travel');
            const i = {
                element: island, 
                name: island.dataset.name,
                button: actionButton,
            };
            this.islands.push(i);

            actionButton.addEventListener('click', () => {
                this.onTravelToIsland(i);
            });
        }

        Views.islands = this;
    }


    onCharacterStateUpdated(character) {
        let islandName = character.state.island;
        if (islandName == null) {
            islandName = 'ferry';
        }

        const currentIsland = islandName.toLowerCase();
        const island = this.islands.find(x => x.name == currentIsland);
        if (this.activeIsland != null){
            this.activeIsland.element.classList.remove('active');
        }
        if (this.destinationIsland != null) {
            this.destinationIsland.element.classList.remove('destination');
        }
        if (island) {
            island.element.classList.add('active');
            this.activeIsland = island;
        }

        if (character.state.destination == null) {
            character.state.destination = "ferry";
        }
        const destination = character.state.destination.toLowerCase();
        if (destination != "ferry") {
            const destIsland = this.islands.find(x => x.name == destination);
            if (destIsland) {
                this.destinationIsland = destIsland;
                this.destinationIsland.element.classList.add('destination');
            }
        }
    }

    onCharacterUpdated(character) {
        this.onCharacterStateUpdated(character);
    }

    onTravelToIsland(island) {
        Ravenfall.service.travelToIslandAsync(island.name);
        const character = Ravenfall.service.getActiveCharacter();
        if (character != null) {        
            character.state.destination = island.name;
            this.onCharacterStateUpdated(character);
        }
    }
}