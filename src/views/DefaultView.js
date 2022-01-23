import { MainView } from "./BaseViews.js";
import { CreateAccountView } from "./CreateAccountView.js";
import { CharacterSelectionView } from './CharacterSelectionView.js';
import { CharacterOverviewView } from './CharacterOverviewView.js';
import { CraftingView } from "./CraftingView.js";
import { InventoryView } from "./InventoryView.js";
import { MarketplaceView } from "./MarketplaceView.js";
import { TrainingView } from "./TrainingView.js";
import { ClanView } from "./ClanView.js";


export class DefaultView extends MainView {
    constructor() {
        super('default');

        this.createAccount = new CreateAccountView(this);
        this.characterSelection = new CharacterSelectionView(this);
        this.characterOverview = new CharacterOverviewView(this);
        this.training = new TrainingView(this);
        this.inventory = new InventoryView(this);
        this.crafting = new CraftingView(this);
        this.marketplace = new MarketplaceView(this);
        this.clan = new ClanView(this);

        this.navigationButtonsContainer = this.element.querySelector('.view-tabs');
        this.lastActiveButton = null;

        this.views = [
            this.createAccount,
            this.characterSelection,
            this.characterOverview,
            this.training,
            this.inventory,
            this.crafting,
            this.marketplace,
            this.clan
        ];

        this.setupNavigationButtons();
    }

    setupNavigationButtons() {
        // this needs to be a bit more fancy later
        // but will just do it super simple for now

        this.views.forEach(view => {
            const elm = this.element.querySelector(`.btn-view-tab[data-navigation='${view.name}']`);
            if (elm && typeof elm != 'undefined') {
                elm.addEventListener('click', () => {
                    this.setViewAndUpdateNavigation(view, elm);
                });
            }
        });
    }

    setViewAndUpdateNavigation(view, elm = null) {
        if (elm == null || typeof elm == 'undefined') {
            elm = this.element.querySelector(`.btn-view-tab[data-navigation='${view.name}']`);
        }

        if (this.lastActiveButton != null) {
            this.lastActiveButton.classList.remove('active');
        }

        if (elm != null && typeof elm != 'undefined') {
            elm.classList.add('active');
            this.lastActiveButton = elm;
        }
        
        this.setView(view);
    }

    hideNavigation() {
        this.navigationButtonsContainer.classList.add('hidden');
    }
    showNavigation() {
        this.navigationButtonsContainer.classList.remove('hidden');
    }

    update() {
        if ((this.activeSubView == null || this.activeSubView == this.characterSelection) && Ravenfall.character != null) {
            this.setViewAndUpdateNavigation(this.characterOverview);
        }
    }

    onCharacterUpdated(character) {

        if (character != null) {
            this.characterOverview.onCharacterUpdated(character);
            this.training.onCharacterUpdated(character); 
            this.showNavigation();
            console.log('We have a character in game');
        } else {
            console.warn('Character removed from game?');
        }
    }

    onShowAccountCreation() {        
        this.setViewAndUpdateNavigation(this.createAccount);
        this.hideNavigation();
    }

    onShowCharacterSelection() {
        this.characterSelection.update();        
        this.setViewAndUpdateNavigation(this.characterSelection);
        this.hideNavigation();
    }
}
