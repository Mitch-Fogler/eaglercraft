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
  var cheatsList = [
    {
      name: "Mushroom / Fire-Flower",
      action: function() {
        game.playerShroom(game.player);
      }
    },
    {
      name: "Star Power",
      action: function() {
        game.playerStar(game.player);
      }
    },
    {
      name: "Scroll Player (px)",
      inputs: [{ placeholder: "100" }],
      action: function(px) {
        game.scrollPlayer(Number(px));
      }
    },
    {
      name: "Float Through Level (s)",
      inputs: [{ placeholder: "5" }],
      action: function(sec) {
        game.scrollTime(Number(sec));
      }
    },
    {
      name: "Fast-Forward (T)",
      inputs: [{ placeholder: "1" }],
      action: function(t) {
        game.fastforward(Number(t));
      }
    },
    {
      name: "Add Thing",
      inputs: [
        { type: "select", options: ["Goomba","Koopa","PiranhaPlant","Coin","Mushroom","FireFlower"] },
        { placeholder: "50" },
        { placeholder: "100" }
      ],
      action: function(type, x, y) {
        var ctor = window[type] || game[type];
        if (typeof ctor === "function") 
          game.addThing(ctor, Number(x), Number(y));
        else
          console.error("Unknown Thing:", type);
      }
    },
    {
      name: "Kill Thing",
      inputs: [{ placeholder: "window.characters[0]" }],
      action: function(expr) {
        try {
          var thing = eval(expr);
          game.killNormal(thing);
        } catch(e) {
          console.error("Bad kill target:", expr, e);
        }
      }
    },
    {
      name: "Go to Map (A,B)",
      inputs: [{ placeholder: "1" },{ placeholder: "1" }],
      action: function(a,b) {
        game.setMap(Number(a), Number(b));
      }
    },
    {
      name: "Random Map",
      action: function() {
        game.setMapRandom();
      }
    },
    {
      name: "Shift to Location",
      inputs: [{ placeholder: "2" }],
      action: function(n) {
        game.shiftToLocation(Number(n));
      }
    },
    {
      name: "Gain Life",
      inputs: [{ placeholder: "1" }],
      action: function(n) {
        game.gainLife(Number(n));
      }
    },
    {
      name: "Low Gravity",
      action: function() {
        game.player.gravity = game.gravity /= 2;
      }
    },
    {
      name: "Unlimited Time",
      action: function() {
        game.data.time.amount = Infinity;
      }
    },
    {
      name: "Lulz()",
      action: function() {
        game.lulz();
      }
    }
  ];

  // Rebuild window.cheats lookup
  window.cheats = {};
  cheatsList.forEach(function(c) {
    window.cheats[c.name.replace(/[^A-Za-z0-9]/g, "_")] = c.name;
  });

  // Render the cheats menu
  var container = document.getElementById("in_cheats");
  if (!container) return;
  container.innerHTML = "";

  cheatsList.forEach(function(c) {
    var row = document.createElement("div");
    row.className = "cheat-row";

    // Label
    var lbl = document.createElement("span");
    lbl.className = "cheat-label";
    lbl.textContent = c.name;
    row.appendChild(lbl);

    // Inputs
    if (c.inputs) {
      c.inputs.forEach(function(spec) {
        var inputEl;
        if (spec.type === "select") {
          inputEl = document.createElement("select");
          spec.options.forEach(function(opt) {
            var o = document.createElement("option"); o.value = opt; o.textContent = opt;
            inputEl.appendChild(o);
          });
        } else {
          inputEl = document.createElement("input");
          inputEl.type = "text";
          inputEl.placeholder = spec.placeholder || "";
        }
        inputEl.className = "cheat-input";
        row.appendChild(inputEl);
      });
    }

    // Run button with placeholder fallback
    var btn = document.createElement("button");
    btn.textContent = "Run";
    btn.className = "cheat-btn";
    btn.onclick = function() {
      var args = Array.from(row.querySelectorAll(".cheat-input"))
                      .map(function(el) {
                        return el.value !== "" ? el.value : el.placeholder;
                      });
      c.action.apply(null, args);
    };
    row.appendChild(btn);

    container.appendChild(row);
  });
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
