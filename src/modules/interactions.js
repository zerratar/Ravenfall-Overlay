const offsetTop = 50;
const offsetLeft = 10;
const width = 340;
const height = 600;

const extension = document.querySelector('.extension');
const extensionToggleButton = document.querySelector('.extension-toggle');
const extensionCloseButton = document.querySelector('.btn-close-panel');
const extensionRefreshButton = document.querySelector('.btn-refresh-panel');
const extensionDarkMode = document.querySelector('.btn-toggle-dark-theme');

const storage = window.localStorage;

let movingToggleButton = false;

const toggleDarkTheme = () => {
    if (extension.classList.contains('dark-theme')) {
        extension.classList.remove('dark-theme');
        extensionDarkMode.querySelector('.value').innerHTML = '&#x263E;';
        storage.removeItem('rf-theme');
    } else {
        extension.classList.add('dark-theme');
        extensionDarkMode.querySelector('.value').innerHTML = '&#x2600;';
        storage.setItem('rf-theme', 'dark-theme');
    }
}

let loadedTheme = storage.getItem('rf-theme');
if (loadedTheme != null) {
    toggleDarkTheme();
} else {
    // Note(zerratar): For some reason the "Toggle dark mode" button is rendered
    //                 in the wrong place. calling the toggleDarkTheme seem to fix it.
    //                 but since we dont want to enforce an inverted change we will toggle it twice.
    //
    //  << You can try and comment these two lines and check the behaviour. Technically it adds the 
    //     dark theme style and update the content then reverts it back by removing the style 
    //     and change back the content. For some reason, this seem to fix the weird thing. >>
    toggleDarkTheme();
    toggleDarkTheme();
}

function dragElement(elmnt) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0,
        mdX = 0,
        mdY = 0,
        elmX = 0,
        elmY = 0;

    elmnt.onmousedown = dragMouseDown;

    const elmPos = storage.getItem('rf-toggle-pos');

    if (elmPos && elmPos.indexOf(';') > 0) {
        const d = elmPos.split(';');

        if (d[0] > offsetTop) {
            elmnt.style.top = d[0] + 'px';
        } else {
            elmnt.style.top = offsetTop + 'px';
        }

        if (d[1] > offsetLeft) {
            elmnt.style.left = d[1] + 'px';
        } else {
            elmnt.style.left = offsetLeft + 'px';
        }
    }

    addEventListener("resize", (event) => {
        /*make sure that the toggler is within view */
        if (elmY < 0) { elmY = 0; }
        if (elmX < 0) { elmX = 0; }
        if (elmY >= window.innerHeight - offsetTop) { elmY = window.innerHeight - offsetTop; }
        if (elmX >= window.innerWidth - offsetLeft) { elmX = window.innerWidth - offsetLeft; }

        // ensure the button is always within the screen
        elmnt.style.top = elmY + 'px';
        elmnt.style.left = elmX + 'px';

        // check if we need to adjust the rotationY 
        let top = parseInt(extensionToggleButton.style.top.replace('px', ''));
        let left = parseInt(extensionToggleButton.style.left.replace('px', ''));
        let yDelta = window.innerHeight - top;
        let xDelta = window.innerWidth - left;

        if (yDelta < height + offsetTop) top = window.innerHeight - (height + offsetTop);
        if (xDelta < width + offsetLeft) left = window.innerWidth - (width + offsetLeft);
        if (top < offsetTop) top = offsetTop;
        if (left < offsetLeft) left = offsetLeft;

        extension.style.top = top + 'px';
        extension.style.left = left + 'px';
    });

    function dragMouseDown(e) {
        movingToggleButton = false;
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        mdX = pos3 = e.clientX;
        mdY = pos4 = e.clientY;

        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        let newTop = (elmnt.offsetTop - pos2);
        let newLeft = (elmnt.offsetLeft - pos1);
        if (newLeft < 0) { newLeft = 0; }
        if (newTop < 0) { newTop = 0; }
        if (newTop >= window.innerHeight - offsetTop) { newTop = window.innerHeight - offsetTop; }
        if (newLeft >= window.innerWidth - offsetLeft) { newLeft = window.innerWidth - offsetLeft; }

        elmY = newTop;
        elmX = newLeft;

        if (newTop > offsetTop) {
            elmnt.style.top = newTop + 'px';
        } else {
            elmnt.style.top = offsetTop + 'px';
        }

        if (newLeft > offsetLeft) {
            elmnt.style.left = newLeft + 'px';
        } else {
            elmnt.style.left = offsetLeft + 'px';
        }

        movingToggleButton = true;

        storage.setItem('rf-toggle-pos', newTop + ';' + newLeft);
    }

    function closeDragElement(e) {
        e = e || window.event;
        let dx = mdX - e.clientX;
        let dy = mdY - e.clientY;

        // to ensure that you can accidently just move slightly when
        // intention is to open the extension
        if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
            movingToggleButton = false;
        }

        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

extensionDarkMode.addEventListener('click', () => {
    toggleDarkTheme();
});

extensionToggleButton.addEventListener('click', e => {
    if (movingToggleButton == true) {
        return;
    }

    // check if we need to adjust the rotationY 
    let left = parseInt(extensionToggleButton.style.left.replace('px', ''));
    let top = parseInt(extensionToggleButton.style.top.replace('px', ''));
    let xDelta = window.innerWidth - left;
    let yDelta = window.innerHeight - top;

    let proc = left / window.innerWidth;

    if (proc < 0) proc = 0;
    if (proc > 1) proc = 1;
    proc = 1 - proc; // inverse
    // lerp

    var lerp = function (v0, v1, t) {
        return v0 + (v1 - v0) * t;
    };

    let val = lerp(-5, 5, proc);
    extension.style.transform = 'perspective(400px) rotateY(' + val + 'deg)';

    if (yDelta < height + offsetTop) top = window.innerHeight - (height + offsetTop);
    if (xDelta < width + offsetLeft) left = window.innerWidth - (width + offsetLeft);
    if (top < offsetTop) top = offsetTop;
    if (left < offsetLeft) left = offsetLeft;

    extension.style.top = top + 'px';
    extension.style.left = left + 'px';

    extension.classList.remove('hidden');
    extensionToggleButton.classList.add('hidden');
});

extensionCloseButton.addEventListener('click', () => {
    extension.classList.add('hidden');
    extensionToggleButton.classList.remove('hidden');
});

if (typeof extensionRefreshButton != 'undefined' && extensionRefreshButton) {
    extensionRefreshButton.addEventListener('click', () => {
        window.location.reload(true)
    });
}

dragElement(extensionToggleButton);