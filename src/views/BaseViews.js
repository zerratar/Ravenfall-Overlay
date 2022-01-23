export class View {
    constructor(viewName) {
        this.name = viewName;
        this.htmlElement = document.querySelector(`.view[data-name='${viewName}']`);
        this.isSubView = this.htmlElement.parentElement && this.htmlElement.parentElement.classList.contains('view');
        this.isActive = false;
    }
    activate() {
        // if (this.isSubView == true) {
        //     this.element.parentElement.classList.add('active');
        // }
        this.isActive = true;
        this.htmlElement.classList.add('active');
    }

    deactivate() {
        this.isActive = false;
        this.htmlElement.classList.remove('active');
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
        this.cView = subView;
    }

    set cView(subView) {
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

    get cView() {
        return this.activeSubView;
    }
}
