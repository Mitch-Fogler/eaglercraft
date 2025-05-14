var loadstart,
    // Security fixes
    isLocal,
    // References
    elemGame,
    game,
    body,
    elemSelect;

function start() {
  // Don't double start
  if(window.loadstart) return;
  window.loadstart = true;
  
  // Know whether this is being run locally
  setLocalStatus();
  
  // Quick UI references
  setReferences();
  
  // Map selection
  setMapSelector();
  
  // Level editor
  setLevelEditor();
  
  // Options
  setOptions();
  
  // Make lots of friends
  setCheats();
}

function setLocalStatus() {
  window.isLocal = window.location.origin == "file://";
}

function setReferences() {
  // Set the game references (elemGame is not the same as the content window)
  window.elemGame = document.getElementById("game");
  window.game = window.elemGame.contentWindow;
  // Local games may not allow contentWindow shenanigans
  if(!isLocal)
    window.game.parentwindow = window;
  
  window.body = document.body;
  window.elemSelect = document.getElementById("in_mapselect");
}

function setMapSelector(timed) {
  // If this isn't ready and hasn't tried before, try it again
  if(!window.elemSelect && !timed)
    setTimeout(function() {
      setMapSelector(true);
    }, 350);
  
  // Get HTML each of the 32 levels' blocks in order
  var innerHTML = "",
      i, j;
  for(i = 1; i <= 8; ++i)
    for(j = 1; j <= 4; ++j)
      innerHTML += createAdderMap(i, j);
  
  // Add that HTML to #in_mapselect, along with a big one for random maps
  elemSelect.innerHTML += innerHTML + createAdderBigMap("Map Generator!", "setGameMapRandom");
  
  // If this isn't local, actually responding to the game loading maps is doable
  // See load.js
  if(!isLocal) {
    // This will allow for onMapLoad
    game.parentwindow = window;
    
    // If the game already has a map, set the class to be loaded
    var elem;
    for(i = 1; i <= 8; ++i)
      for(j = 1; j <= 4; ++j) {
        if(game["World" + i + String(j)] && (elem = document.getElementById("maprect" + i + "," + j)))
          elem.className = "maprect";
      }
  }
}

function createAdderMap(i, j) {
  var adder = "";
  adder += "<div class='maprectout'>";
  adder += "<div id='maprect" + i + "," + j;
  adder += "' class='maprect" +  (isLocal ? "" : " off") + "' onclick='setGameMap(" + i + "," + j + ")'>";
  adder += i + "-" + j;
  adder += "</div></div>";
  return adder;
}

function createAdderBigMap(name, onclick, giant) {
  var adder = "";
  adder += "<div class='maprectout'>";
  adder += "<div class='maprect big " + (giant ? "giant" : "" ) + "' onclick='" + onclick + "()'>";
  adder += name;
  adder += "</div></div>";
  return adder;
}

function setGameMap(one, two) {
  // If it hasn't been loaded yet, don't do anything
  if(document.getElementById("maprect" + one + "," + two).className != "maprect")
    return;
  
  // Otherwise go to the map
  game.postMessage({
    type: "setMap",
    map: [one, two]
  }, "*");
  game.focus();
}

// See load.js
function onMapLoad(one, two) {
  var elem = document.getElementById("maprect" + one + "," + two);
  if(elem)
    elem.className = "maprect";
}

function setGameMapRandom() {
  game.postMessage({
    type: "setMap",
    map: ["Random", "Overworld"]
  }, "*");
  game.focus();
}

function setLevelEditor() {
  var out = document.getElementById("in_editor"),
      blurb = "Why use Nintendo's?<br />";
  button = createAdderBigMap("Make your<br />own levels!", "startEditor", true);
  out.innerHTML += blurb + button + "<br />You can save these as text files when you're done.";
}

function startEditor() {
  game.postMessage({
    type: "startEditor"
  }, "*");
  game.focus();
}

// Fills the options menu with a bunch of divs, each of which have an onclick of toggleGame('XYZ')
function setOptions() {
  var out = document.getElementById("in_options"),
      options = [
        "Mute",
        "Luigi",
        "FastFWD"
      ],
      innerHTML = "",
      option, i;
  for(i in options) {
    option = options[i];
    innerHTML += "<div class='maprectout' onclick='toggleGame(\"" + option + "\")'><div class='maprect big larger'>Toggle " + option + "</div></div>";
    innerHTML += "<br />";
  }
  out.innerHTML += innerHTML + "<br />More coming soon!";
}

// toggleGame('XYZ') sends a message to the game to toggle XYZ
function toggleGame(me) {
  game.postMessage({
    type: "toggleOption",
    option: me
  }, "*");
}

function setCheats() {
  // 1) Define your cheats with human names + exec strings
  var cheatsList = [
    { name: "Mushroom / Fire-Flower", cmd: "game.playerShroom(game.player)" },
    { name: "Star Power",              cmd: "game.playerStar(game.player)" },
    { name: "Scroll Player (px)",      cmd: "game.scrollPlayer(100)" },
    { name: "Float (s)",               cmd: "game.scrollTime(5)" },
    { name: "Fast-Forward (T)",        cmd: "game.fastforward(1)" },
    { name: "Add Thing",               cmd: "game.addThing(Goomba, 50, 100)" },
    { name: "Kill Thing",              cmd: "game.killNormal(window.characters[0])" },
    { name: "Go to Map",               cmd: "game.setMap(1,2)" },
    { name: "Random Map",              cmd: "game.setMapRandom()" },
    { name: "Shift Location",          cmd: "game.shiftToLocation(2)" },
    { name: "Gain Life",               cmd: "game.gainLife(1)" },
    { name: "Low Gravity",             cmd: "game.player.gravity = game.gravity/2" },
    { name: "Unlimited Time",          cmd: "game.data.time.amount = Infinity" },
    { name: "Lulz()",                  cmd: "game.lulz()" }
  ];

  // 2) Grab the container and build a UL
  var container = document.getElementById("in_cheats");
  if (!container) return;
  var ul = document.createElement("ul");
  ul.style.listStyle = "none";
  ul.style.padding = "0";
  ul.style.margin = "0";

  // 3) For each cheat, create an LI and attach click handler
  cheatsList.forEach(function(c) {
    var li = document.createElement("li");
    li.textContent = c.name;
    li.style.cursor = "pointer";
    li.style.padding = "4px 0";
    li.setAttribute("title", c.cmd);

    // On click, execute the command string
    li.addEventListener("click", function() {
      try {
        eval(c.cmd);  // runs the cheat in global scope :contentReference[oaicite:7]{index=7}
      } catch(e) {
        console.error("Cheat failed:", e);
      }
    }, false);        // use addEventListener for best practice :contentReference[oaicite:8]{index=8}

    ul.appendChild(li);
  });

  // 4) Inject into your menu and clear any old content
  container.innerHTML = "";
  container.appendChild(ul);
}



function displayCheats() {
  
  for(i in cheats)
    printCheat(i, cheats[i]);
  return "Have fun!";
}

function printCheat(name, text) {
  for (i = cheatsize - name.length; i > 0; --i)
    name += ".";
  console.log(name.replace("_", " ") + "...... " + text);
}
