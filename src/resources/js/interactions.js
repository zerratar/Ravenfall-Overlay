const offsetTop = 69;
const offsetLeft = 10;
const width = 340;
const height = 600;

const extension = document.querySelector('.extension');
const extensionToggleButton = document.querySelector('.extension-toggle');
const extensionCloseButton = document.querySelector('.btn-close-panel');
const extensionRefreshButton = document.querySelector('.btn-refresh-panel');
const extensionDarkMode = document.querySelector('.btn-toggle-dark-theme');

const storage = window.localStorage;

function toggleDarkTheme() {
    if (extension.classList.contains('dark-theme')) {
        extension.classList.remove('dark-theme');
        extensionDarkMode.querySelector('.value').innerHTML = '<i class="fa fa-moon"></i>';
        storage.removeItem('rf-theme');
    } else {
        extension.classList.add('dark-theme');
        extensionDarkMode.querySelector('.value').innerHTML = '<i class="fa fa-sun"></i>';
        storage.setItem('rf-theme', 'dark-theme');
    }
}

const loadedTheme = storage.getItem('rf-theme');

if (loadedTheme != null) toggleDarkTheme();

let movingToggleButton = false;

function dragElement(elmnt) {
    const elmPos = storage.getItem('rf-toggle-pos');

    let d = [offsetTop, offsetLeft];
    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;
    let mdX = 0;
    let mdY = 0;
    let elmX = 0;
    let elmY = 0;

    if (elmPos && elmPos.indexOf(';') > -1) {
        d = elmPos.split(';');

        if (parseInt(d[0]) > offsetTop)
            elmnt.style.top = d[0] + 'px'
        else
            elmnt.style.top = offsetTop + 'px';

        if (parseInt(d[1]) > offsetLeft)
            elmnt.style.left = d[1] + 'px';
        else
            elmnt.style.left = offsetLeft + 'px';

        elmX = elmnt.style.left;
        elmY = elmnt.style.top;
    }

    elmnt.onmousedown = dragMouseDown;

    addEventListener("resize", (event) => {
        if (elmY < offsetTop) elmY = offsetTop;
        if (elmX < offsetLeft) elmX = offsetLeft;
        if (elmY >= window.innerHeight - offsetTop) elmY = window.innerHeight - offsetTop;
        if (elmX >= window.innerWidth - offsetLeft) elmX = window.innerWidth - offsetLeft;

        elmnt.style.top = elmY + 'px';
        elmnt.style.left = elmX + 'px';

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

        mdX = pos3 = e.clientX;
        mdY = pos4 = e.clientY;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        movingToggleButton = true;

        e = e || window.event;
        e.preventDefault();

        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        let newTop = (elmnt.offsetTop - pos2);
        let newLeft = (elmnt.offsetLeft - pos1);

        if (newTop < offsetTop) newTop = offsetTop;
        if (newLeft < offsetLeft) newLeft = offsetLeft;
        if (newTop >= window.innerHeight - offsetTop) newTop = window.innerHeight - offsetTop;
        if (newLeft >= window.innerWidth - offsetLeft) newLeft = window.innerWidth - offsetLeft;

        elmY = newTop;
        elmX = newLeft;

        if (newTop > offsetTop)
            elmnt.style.top = newTop + 'px';
        else
            elmnt.style.top = offsetTop + 'px';

        if (newLeft > offsetLeft)
            elmnt.style.left = newLeft + 'px';
        else
            elmnt.style.left = offsetLeft + 'px';

        storage.setItem('rf-toggle-pos', newTop + ';' + newLeft);
    }

    function closeDragElement(e) {
        e = e || window.event;

        let dx = mdX - e.clientX;
        let dy = mdY - e.clientY;

        if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) movingToggleButton = false;

        document.onmouseup = null;
        document.onmousemove = null;
    }
}

extensionDarkMode.addEventListener('click', () => {
    toggleDarkTheme();
});

extensionToggleButton.addEventListener('click', e => {
    if (movingToggleButton) return;

    let left = parseInt(extensionToggleButton.style.left.replace('px', ''));
    let top = parseInt(extensionToggleButton.style.top.replace('px', ''));
    let xDelta = window.innerWidth - left;
    let yDelta = window.innerHeight - top;

    let proc = left / window.innerWidth;

    if (proc < 0) proc = 0;
    if (proc > 1) proc = 1;

    proc = 1 - proc;

    var lerp = function (v0, v1, t) {
        return v0 + (v1 - v0) * t;
    };

    extension.style.transform = 'perspective(400px) rotateY(' + lerp(-5, 5, proc) + 'deg)';

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

dragElement(extensionToggleButton);