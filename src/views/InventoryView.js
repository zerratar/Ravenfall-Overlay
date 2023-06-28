import { SubView } from "./BaseViews.js";


export class InventoryView extends SubView {
    constructor(parentView) {
        super(parentView, 'inventory');
        Views.inventory = this;

        this.lastCharacterId = -1;
        this.items = [];
        this.inventoryItemsList = document.querySelector('.inventory-items');
        this.inventoryItemTemplate = document.querySelector('.inventory-item').outerHTML;
        this.inventoryItemsList.innerHTML = '';
    }

    onCharacterUpdated(character) {
        console.log("Inventory View: Character Updated");
        if (character == null || character.id != this.lastCharacterId) {
            this.clearItems();
        }

        if (character != null) {
            this.lastCharacterId = character.id;
            try {
                this.updateItems(character.inventoryItems);
            } catch {
                console.error("Failed to update inventory items. Inventory will be rebuilt.");
                this.clearItems();
                this.updateItems(character.inventoryItems);
            }
        }
    }

    clearItems() {
        this.inventoryItemsList.innerHTML = '';
        this.items = [];
    }

    updateItems(inventoryItems) {
        /* Inventory Items has following structure 
            amount
            enchantment
            equipped
            flags
            id
            itemId
            name
            soulbound
            tag
            transmogrificationId
        */

        if (!Ravenfall.itemsLoaded) {
            console.log("Items has not been loaded yet, while trying to update inventory items.");
            return;
        }
                
        for (let item of this.items) {
            item.updated = false;
        }

        for (let inv of inventoryItems) {
            const item = this.items.find(x => x.id == inv.id);
            if (item) {
                this.update(inv, item);
            } else {
                this.items.push(
                    { id: inv.id, item: inv, element: this.create(inv), updated: true }
                );
            }
        }

        for (let item of [...this.items]) {
            if (item.updated == false) {
                // this one should be removed.
                item.element.remove();
                this.items = this.items.splice(this.items.indexOf(item), 1);
            }
        }
    }

    create(inventoryItem) {
        if (!Ravenfall.itemsLoaded) {
            console.log("Items has not been loaded yet, while trying to create inventory item.");
            return;
        }
        const item = Ravenfall.items.find(x => x.id == inventoryItem.itemId);

        let elm = document.createElement('div');
        this.inventoryItemsList.appendChild(elm);

        let name = inventoryItem.name;
        if (name == null) {
            name = item.name;
        }

        let classList = "";

        if (inventoryItem.soulbound == true) {
            classList += " soulbound";
        }

        if (inventoryItem.enchantment != null) {
            classList += " enchanted";
        }

        if (inventoryItem.equipped == true) {
            classList += " equipped";
        }

        elm.outerHTML = this.inventoryItemTemplate
            .replace('data-src', 'src')
            .replace('{classList}', classList)
            .replace('{id}', inventoryItem.id).replace('{id}', inventoryItem.id)
            .replace('{name}', name).replace('{name}', name).replace('{name}', name)
            .replace('{amount}', inventoryItem.amount)
            .replace('{soulbound}', inventoryItem.soulbound)
            .replace('{enchantment}', inventoryItem.enchantment)
            .replace('{type}', item.type)
            .replace('{category}', item.category)
            .replace('{url}', window.ravenfallUrl + 'imgs/items/' + item.id + '.png');

        return elm;
    }

    update(inventoryItem, existing) {
        const item = Ravenfall.items.find(x => x.id == inventoryItem.itemId);
        let name = inventoryItem.name;
        if (name == null) {
            name = item.name;
        }

        let classList = "";
        if (inventoryItem.soulbound == true) {
            classList += " soulbound";
        }

        if (inventoryItem.enchantment != null) {
            classList += " enchanted";
        }

        if (inventoryItem.equipped == true) {
            classList += " equipped";
        }

        existing.element.outerHTML = this.inventoryItemTemplate
            .replace('data-src', 'src')
            .replace('{classList}', classList)
            .replace('{id}', inventoryItem.id).replace('{id}', inventoryItem.id).replace('{id}', inventoryItem.id)
            .replace('{name}', name).replace('{name}', name).replace('{name}', name) // inventoryItem.name || item.name
            .replace('{amount}', inventoryItem.amount)
            .replace('{soulbound}', inventoryItem.soulbound)
            .replace('{enchantment}', inventoryItem.enchantment)
            .replace('{type}', item.type)
            .replace('{category}', item.category)
            .replace('{url}', window.ravenfallUrl + 'imgs/items/' + item.id + '.png');

        existing.updated = true;
    }
}
