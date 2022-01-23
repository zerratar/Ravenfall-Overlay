
let movingToggleButton = false;

const extension = document.querySelector('.extension');
const extensionToggleButton = document.querySelector('.extension-toggle');
const extensionCloseButton = document.querySelector('.btn-close-panel');
const extensionDarkMode = document.querySelector('.btn-toggle-dark-mode');

const storage = window.localStorage;

const toggleDarkTheme = () => {
  if (extension.classList.contains('dark-theme')) {
    extension.classList.remove('dark-theme');
    extensionDarkMode.innerHTML = '&blk34;';
    storage.removeItem('rf-theme');
  } else {
    extension.classList.add('dark-theme');
    extensionDarkMode.innerHTML = '&blk14;';
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
      pos4 = 0;
    var mdX = 0,
      mdY = 0;
    elmnt.onmousedown = dragMouseDown;
  
    const elmPos = localStorage.getItem('rf-toggle-pos');
  
    if (elmPos && elmPos.indexOf(';') > 0) {
      const d = elmPos.split(';');
      elmnt.style.top = d[0];
      elmnt.style.left = d[1];
    }
  
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
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
      movingToggleButton = true;
  
      localStorage.setItem('rf-toggle-pos', elmnt.style.top + ';' + elmnt.style.left);
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

  
/*
  Make the toggle button draggable
*/


extensionDarkMode.addEventListener('click', () => {
  toggleDarkTheme();
});

extensionToggleButton.addEventListener('click', () => {
  if (movingToggleButton == true) {
    return;
  }
  extension.classList.remove('hidden');
  extensionToggleButton.classList.add('hidden');
});

extensionCloseButton.addEventListener('click', () => {
  extension.classList.add('hidden');
  extensionToggleButton.classList.remove('hidden');
});


dragElement(document.getElementById("extension-toggle"));
