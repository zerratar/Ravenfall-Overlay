
let movingToggleButton = false;

const extension = document.querySelector('.extension');
const extensionToggleButton = document.querySelector('.extension-toggle');
const extensionCloseButton = document.querySelector('.btn-close-panel');
const extensionDarkMode = document.querySelector('.btn-toggle-dark-theme');

const storage = window.localStorage;
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
      pos4 = 0;
    var mdX = 0,
      mdY = 0;
    elmnt.onmousedown = dragMouseDown;
    
    var elmX = 0;
    var elmY = 0;

    const elmPos = localStorage.getItem('rf-toggle-pos');

    addEventListener("resize", (event) => {

      /*make sure that the toggler is within view */
      let offset=50;
      if (elmY < 0) { elmYelmY = 0;}
      if (elmX < 0) { elmX = 0; }
      if (elmY >= window.innerHeight-offset) { elmY = window.innerHeight-offset; }
      if (elmX >= window.innerWidth-offset) { elmX = window.innerWidth-offset; }
      
      // ensure the button is always within the screen
      elmnt.style.top = elmY + "px";
      elmnt.style.left = elmX + "px";

      /* make sure the extension is in view. */
      offset = 40;
      let width = 340;
      let height = 600;  
      
      // check if we need to adjust the rotationY 
      let left = parseInt(extensionToggleButton.style.left.replace('px', ''));
      let top = parseInt(extensionToggleButton.style.top.replace('px', ''));
      let xDelta = window.innerWidth - left;
      let yDelta = window.innerHeight - top;
      
      if (xDelta<width+offset) left=window.innerWidth-(width+offset);
      if (yDelta<height+offset) top=window.innerHeight-(height+offset);
      if (left<offset) left=offset;
      if(top<offset) top=offset; // its more important to make sure that we are under the top, since the X button is there.
      
      extension.style.top = top + 'px';
      extension.style.left = left + 'px';


    });

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
      let offset=50;
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      let newTop =  (elmnt.offsetTop - pos2);
      let newLeft = (elmnt.offsetLeft - pos1);
      if (newLeft < 0) { newLeft = 0;}
      if (newTop < 0) { newTop = 0; }
      if (newTop >= window.innerHeight-offset) { newTop = window.innerHeight-offset; }
      if (newLeft >= window.innerWidth-offset) { newLeft = window.innerWidth-offset; }

      elmY=newTop;
      elmX=newLeft;

      elmnt.style.top = newTop + "px";
      elmnt.style.left = newLeft + "px";
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

extensionToggleButton.addEventListener('click', e => {
  if (movingToggleButton == true) {
    return;
  }

  let offset = 40;
  let width = 340;
  let height = 600;  
  
  // check if we need to adjust the rotationY 
  let left = parseInt(extensionToggleButton.style.left.replace('px', ''));
  let top = parseInt(extensionToggleButton.style.top.replace('px', ''));
  let xDelta = window.innerWidth - left;
  let yDelta = window.innerHeight - top;

  let proc = left / window.innerWidth;

  if (proc<0) proc=0;
  if (proc>1) proc=1;
  proc = 1 - proc; // inverse
  // lerp

  var lerp = function(v0, v1, t) {
    return v0 + (v1-v0) * t;
  };

  let val = lerp(-5, 5, proc);
  extension.style.transform = 'perspective(400px) rotateY(' + val + 'deg)';

  if (left<offset) left=offset;
  if (xDelta<width+offset) left=window.innerWidth-(width+offset);
  if (yDelta<height+offset) top=window.innerHeight-(height+offset);
  if (top<offset) top=offset;

  extension.style.top = top + 'px';
  extension.style.left = left + 'px';

  extension.classList.remove('hidden');
  extensionToggleButton.classList.add('hidden');
  // pollGameState();
});

extensionCloseButton.addEventListener('click', () => {
  extension.classList.add('hidden');
  extensionToggleButton.classList.remove('hidden');  
});

dragElement(extensionToggleButton);



// dragElement(document.getElementById("extension"));
