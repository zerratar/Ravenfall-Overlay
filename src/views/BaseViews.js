export class View {
    constructor(viewName) {
        this.name = viewName;
        this.element = document.querySelector(`.view[data-name='${viewName}']`);
        this.isSubView = this.element.parentElement && this.element.parentElement.classList.contains('view');
        this.isActive = false;
    }
    activate() {
        // if (this.isSubView == true) {
        //     this.element.parentElement.classList.add('active');
        // }
        this.isActive = true;
        this.element.classList.add('active');
    }

    deactivate() {
        this.isActive = false;
        this.element.classList.remove('active');
    }

    onEnter() {
        console.log('on enter ' + this.constructor.name);
    }

    onExit() {
        console.log('on exit ' + this.constructor.name);
    }
}

export class SubView extends View {
    constructor(parentView, viewName) {
        super(viewName);
        this.parent = parentView;
    }
}

export class MainView extends View {
    constructor(name) {
        super(name);
        this.activeSubView = null;
    }

    setView(subView) {
        this.view = subView;
    }

    set view(subView) {
        const oldSubView = this.activeSubView;
        const enter = oldSubView != subView;
        
        if (oldSubView != null) {
            oldSubView.deactivate();
        }

        this.activeSubView = subView;
        this.activeSubView.activate();
        

        if (enter) {
            this.activeSubView.onEnter();

            if (oldSubView != null) {
                oldSubView.onExit();
            }
        }
    }

    get view() {
        return this.activeSubView;
    }
}
