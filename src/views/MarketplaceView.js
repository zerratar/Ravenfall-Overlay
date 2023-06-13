import { SubView } from "./BaseViews.js";


export class MarketplaceView extends SubView {
    constructor(parentView) {
        super(parentView, 'marketplace');

        Views.marketplace = this;
    }
}
