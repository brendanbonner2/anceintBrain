// Cloned by Brendan on 28 Oct 2019 from World "Complex World" by Starter user
// Please leave this clone trail here.


// ==== Starter World ===============================================================================================
// (c) Ancient Brain Ltd. All rights reserved.
// This code is only for use on the Ancient Brain site.
// This code may be freely copied and edited by anyone on the Ancient Brain site.
// This code may not be copied, re-published or used on any other website.
// To include a run of this code on another website, see the "Embed code" links provided on the Ancient Brain site.
// ==================================================================================================================



// =============================================================================================
// More complex starter World
// 3d-effect Maze World (really a 2-D problem)
// Movement is on a semi-visible grid of squares
//
// This more complex World shows:
// - Skybox
// - Internal maze (randomly drawn each time)
// - Enemy actively chases agent
// - Music/audio
// - 2D world (clone this and set show3d = false)
// - User keyboard control (clone this and comment out Mind actions to see)
// =============================================================================================


// =============================================================================================
// Scoring:
// Bad steps = steps where enemy is within one step of agent.
// Good steps = steps where enemy is further away.
// Score = good steps as percentage of all steps.
//
// There are situations where agent is trapped and cannot move.
// If this happens, you score zero.
// =============================================================================================








// ===================================================================================================================
// === Start of tweaker's box ========================================================================================
// ===================================================================================================================

// The easiest things to modify are in this box.
// You should be able to change things in this box without being a JavaScript programmer.
// Go ahead and change some of these. What's the worst that could happen?


AB.clockTick = 100;

// Speed of run: Step every n milliseconds. Default 100.

AB.maxSteps = 1000;

// Length of run: Maximum length of run in steps. Default 1000.

AB.screenshotStep = 50;

// Take screenshot on this step. (All resources should have finished loading.) Default 50.



//---- global constants: -------------------------------------------------------

const show3d = true; // Switch between 3d and 2d view (both using Three.js)


const TEXTURE_WALL = '/uploads/brendanb/box_tron1.jpg';
const TEXTURE_MAZE = '/uploads/brendanb/box_tron1.jpg';
const TEXTURE_AGENT = '/uploads/starter/pacman.jpg';
const TEXTURE_ENEMY = '/uploads/starter/ghost.3.png';


const gridsize = 15; // number of squares along side of world

const NOBOXES = Math.trunc((gridsize * gridsize) / 10);
// density of maze - number of internal boxes
// (bug) use trunc or can get a non-integer

const squaresize = 100; // size of square in pixels

const MAXPOS = gridsize * squaresize; // length of one side in pixels

const SKYCOLOR = 0xddffdd; // a number, not a string


const startRadiusConst = MAXPOS * 0.8; // distance from centre to start the camera at
const maxRadiusConst = MAXPOS * 10; // maximum distance from camera we will render things



//--- change ABWorld defaults: -------------------------------

ABHandler.MAXCAMERAPOS = maxRadiusConst;

ABHandler.GROUNDZERO = true; // "ground" exists at altitude zero



//--- skybox: -------------------------------
// skybox is a collection of 6 files
// x,y,z positive and negative faces have to be in certain order in the array
// https://threejs.org/docs/#api/en/loaders/CubeTextureLoader

const SKYBOX_ARRAY = [
  "/uploads/brendanb/radial_gradient_blue.png",
  "/uploads/brendanb/radial_gradient_blue.png",
  "/uploads/brendanb/radial_gradient_lightblue.png",
  "/uploads/brendanb/radial_gradient_darkblue.png",
  "/uploads/brendanb/radial_gradient_blue.png",
  "/uploads/brendanb/radial_gradient_blue.png",

];



//--- Mind can pick one of these actions -----------------

const ACTION_LEFT = 0;
const ACTION_RIGHT = 1;
const ACTION_UP = 2;
const ACTION_DOWN = 3;
const ACTION_STAYSTILL = 4;

// in initial view, (smaller-larger) on i axis is aligned with (left-right)
// in initial view, (smaller-larger) on j axis is aligned with (away from you - towards you)


// contents of a grid square

const GRID_BLANK = 0;
const GRID_WALL = 1;
const GRID_MAZE = 2;
const GRID_ENEMY = 10;
const GRID_AGENT = 20;

var BOXHEIGHT; // 3d or 2d box height

var GRID = new Array(gridsize); // can query GRID about whether squares are occupied, will in fact be initialised as a 2D array

var theagent, theenemy;

var wall_texture, agent_texture, enemy_texture, maze_texture;


// enemy and agent position on squares
var ei, ej, ai, aj;

function coordinates (i,j){
    this.i = i;
    this.j = j;
}
var start = new coordinates();
var target = new coordinates();

var badsteps;
var goodsteps;

var diagonal = true;

function loadResources() // asynchronous file loads - call initScene() when all finished
{
  var loader1 = new THREE.TextureLoader();
  var loader2 = new THREE.TextureLoader();
  var loader3 = new THREE.TextureLoader();
  var loader4 = new THREE.TextureLoader();

  loader1.load(TEXTURE_WALL, function(thetexture) {
    thetexture.minFilter = THREE.LinearFilter;
    wall_texture = thetexture;
    if (asynchFinished()) initScene(); // if all file loads have returned
  });

  loader2.load(TEXTURE_AGENT, function(thetexture) {
    thetexture.minFilter = THREE.LinearFilter;
    agent_texture = thetexture;
    if (asynchFinished()) initScene();
  });

  loader3.load(TEXTURE_ENEMY, function(thetexture) {
    thetexture.minFilter = THREE.LinearFilter;
    enemy_texture = thetexture;
    if (asynchFinished()) initScene();
  });

  loader4.load(TEXTURE_MAZE, function(thetexture) {
    thetexture.minFilter = THREE.LinearFilter;
    maze_texture = thetexture;
    if (asynchFinished()) initScene();
  });

}


function asynchFinished() // all file loads returned
{
  if (wall_texture && agent_texture && enemy_texture && maze_texture) return true;
  else return false;
}




//--- grid system -------------------------------------------------------------------------------
// my numbering is 0 to gridsize-1


function occupied(i, j) // is this square occupied
{
  if ((ei == i) && (ej == j)) return true; // variable objects
  if ((ai == i) && (aj == j)) return true;

  if (GRID[i][j] == GRID_WALL) return true; // fixed objects
  if (GRID[i][j] == GRID_MAZE) return true;

  return false;
}


// translate my (i,j) grid coordinates to three.js (x,y,z) coordinates
// logically, coordinates are: y=0, x and z all positive (no negative)
// logically my dimensions are all positive 0 to MAXPOS
// to centre everything on origin, subtract (MAXPOS/2) from all dimensions

function translate(i, j) {
  var v = new THREE.Vector3();

  v.y = 0;
  v.x = (i * squaresize) - (MAXPOS / 2);
  v.z = (j * squaresize) - (MAXPOS / 2);

  return v;
}




function initScene() // all file loads have returned
{
  var i, j, shape, thecube;

  // set up GRID as 2D array

  for (i = 0; i < gridsize; i++)
    GRID[i] = new Array(gridsize);


  // set up walls

  for (i = 0; i < gridsize; i++)
    for (j = 0; j < gridsize; j++)
      if ((i === 0) || (i == gridsize - 1) || (j === 0) || (j == gridsize - 1)) {
        GRID[i][j] = GRID_WALL;
        shape = new THREE.BoxGeometry(squaresize, BOXHEIGHT, squaresize);
        thecube = new THREE.Mesh(shape);
        thecube.material = new THREE.MeshBasicMaterial({
          map: wall_texture
        });

        thecube.position.copy(translate(i, j)); // translate my (i,j) grid coordinates to three.js (x,y,z) coordinates
        ABWorld.scene.add(thecube);
      }
  else
    GRID[i][j] = GRID_BLANK;


  // set up maze

  for (var c = 1; c <= NOBOXES; c++) {
    i = AB.randomIntAtoB(1, gridsize - 2); // inner squares are 1 to gridsize-2
    j = AB.randomIntAtoB(1, gridsize - 2);

    GRID[i][j] = GRID_MAZE;

    shape = new THREE.BoxGeometry(squaresize, BOXHEIGHT, squaresize);
    thecube = new THREE.Mesh(shape);
    thecube.material = new THREE.MeshBasicMaterial({
      map: maze_texture
    });

    thecube.position.copy(translate(i, j)); // translate my (i,j) grid coordinates to three.js (x,y,z) coordinates
    ABWorld.scene.add(thecube);
  }


  // set up enemy
  // start in random location

  do {
    i = AB.randomIntAtoB(1, gridsize - 2);
    j = AB.randomIntAtoB(1, gridsize - 2);
  }
  while (occupied(i, j)); // search for empty square

  ei = i;
  ej = j;

  //	 shape    = new THREE.BoxGeometry ( squaresize, BOXHEIGHT, squaresize );
  shape = new THREE.SphereGeometry(squaresize / 2, BOXHEIGHT / 2, squaresize / 2);
  theenemy = new THREE.Mesh(shape);
  theenemy.material = new THREE.MeshBasicMaterial({
    map: enemy_texture
  });
  ABWorld.scene.add(theenemy);
  drawEnemy();



  // set up agent
  // start in random location

  do {
    i = AB.randomIntAtoB(1, gridsize - 2);
    j = AB.randomIntAtoB(1, gridsize - 2);
  }
  while (occupied(i, j)); // search for empty square

  ai = i;
  aj = j;

  shape = new THREE.SphereGeometry(squaresize / 2, BOXHEIGHT / 2, squaresize / 2);
  theagent = new THREE.Mesh(shape);
  theagent.material = new THREE.MeshBasicMaterial({
    map: agent_texture
  });
  ABWorld.scene.add(theagent);
  drawAgent();


  // finally skybox
  // setting up skybox is simple
  // just pass it array of 6 URLs and it does the asych load

  ABWorld.scene.background = new THREE.CubeTextureLoader().load(SKYBOX_ARRAY, function() {
    ABWorld.render();

    AB.removeLoading();

    AB.runReady = true; // start the run loop
  });

}





// --- draw moving objects -----------------------------------


function drawEnemy() // given ei, ej, draw it
{
  theenemy.position.copy(translate(ei, ej)); // translate my (i,j) grid coordinates to three.js (x,y,z) coordinates

  ABWorld.lookat.copy(theenemy.position); // if camera moving, look back at where the enemy is
}


function drawAgent() // given ai, aj, draw it
{
  theagent.position.copy(translate(ai, aj)); // translate my (i,j) grid coordinates to three.js (x,y,z) coordinates

  ABWorld.follow.copy(theagent.position); // follow vector = agent position (for camera following agent)
}


// A* Support Functions

function gridSpot(i, j) {
  // Location
  this.i = i;
  this.j = j;

  // f, g, and h values for A*
  this.f = 0;
  this.g = 0;
  this.h = 0;

  // Neighbors
  this.neighbors = [];

  // Where did I come from?
  this.parent = undefined;


  // Figure out who my neighbors are
  this.addNeighbors = function() {
    var i = this.i;
    var j = this.j;


    if (i < gridsize - 1) this.neighbors.push(aStarGrid[i + 1][j]);
    if (i > 0) this.neighbors.push(aStarGrid[i - 1][j]);
    if (j < gridsize - 1) this.neighbors.push(aStarGrid[i][j + 1]);
    if (j > 0) this.neighbors.push(aStarGrid[i][j - 1]);

    if (diagonal)
    // diagonals are also neighbours:
    {
      if (i > 0 && j > 0) this.neighbors.push(aStarGrid[i - 1][j - 1]);
      if (i < gridsize - 1 && j > 0) this.neighbors.push(aStarGrid[i + 1][j - 1]);
      if (i > 0 && j < gridsize - 1) this.neighbors.push(aStarGrid[i - 1][j + 1]);
      if (i < gridsize - 1 && j < gridsize - 1) this.neighbors.push(aStarGrid[i + 1][j + 1]);
    }
  };
}

var aStarGrid = [];

// initialise a astar grid in parallel to main "GRID"
function aStarInit() {
  var i, j;
  // create the aStarGrid
  for (i = 0; i < gridsize; i++) {
    aStarGrid[i] = [];
    for (j = 0; j < gridsize; j++) {
      aStarGrid[i][j] = new gridSpot(i, j);
      console.log("A* Initialise: " + i + ", "+ j);
    }

  }

      for (i = 0; i < gridsize; i++) {
        for (j = 0; j < gridsize; j++) {
          aStarGrid[i][j].addNeighbors();
        }
    }

    console.log("A* Initialise: Complete");
  }


// A* function that returns the next position in the pathcolor
function aStar(grid, start, target) {

  // Initialize both open and closed list
  var openSet = [];
  var closedSet = [];
  var child;
  var completed = false;
  var targetNode = aStarGrid[target.i][target.j]; // define the target
  var startNode = aStarGrid[start.i][start.j]; // define the target
  var currentNode;

  openSet.push(startNode); // push startnode onto Openset
  startNode.f = 0; // reset first f value

  while ((openSet.length > 0) && !completed) {
    openSet.sort(); //sort set by f
    currentNode = openSet.shift(); // shift the first entry
    closedSet.push(currentNode);
    console.log("ClosedSet is " + closedSet.length);

    if (currentNode == targetNode) {
      while (targetNode.parent != startNode) {
        currentNode = currentNode.parent;
      }
      completed = true;
      // backtrack to return the next move
    } else {
      for (n = 0; n < currentNode.neighbors.length; n++) {
        // for each of the neighbours, calculate the children
        child = currentNode.neighbors[n];

        // check if in closedSet or occupied
        if (closedSet.indexOf(child) < 0) {
          if (occupied(child.i, child.j))
            closedSet.push(child);
        } else {
          // check if child is in the ClosedSet
          child.g = currentNode.g + 1;
          child.h = aStarHeuristics(child, targetNode);
          child.f = child.g + child.h;
        } // check if closedSet
      } // loop through neighbours
    } //check if we have reached target
  }

  // end of openSet, and not completed.
}


function aStarHeuristics(start, end) {
  if (diagonal)
    return (Math.pow(Math.abs(start.i - end.i), 2) + Math.pow(Math.abs(start.j - end.j), 2));
  else
    return (Math.abs(start.i - start.i) + Math.abs(start.j - end.j));
}


// --- take actions -----------------------------------

function moveLogicalEnemy() {
  // move towards agent
  // put some randomness in so it won't get stuck with barriers

  //   console.log("moving enemy: " + ei + ", " + ej)
  var i, j;

  start.i = ei; start.j = ej;
  target.i = ai; target.j = aj;
  bestPath = aStar(GRID, start, target);

  // move enemy to new position
  ei = bestPath[0];
  ej = bestPath[1];

  //
  // if (ei < ai) i = AB.randomIntAtoB(ei, ei + 1);
  // if (ei == ai) i = ei;
  // if (ei > ai) i = AB.randomIntAtoB(ei - 1, ei);
  //
  // if (ej < aj) j = AB.randomIntAtoB(ej, ej + 1);
  // if (ej == aj) j = ej;
  // if (ej > aj) j = AB.randomIntAtoB(ej - 1, ej);
  //
  // if (!occupied(i, j)) // if no obstacle then move, else just miss a turn
  // {
  //   ei = i;
  //   ej = j;
  // }

}


function moveLogicalAgent(a) // this is called by the infrastructure that gets action a from the Mind
{
  var i = ai;
  var j = aj;

  if (a == ACTION_LEFT) i--;
  else if (a == ACTION_RIGHT) i++;
  else if (a == ACTION_UP) j++;
  else if (a == ACTION_DOWN) j--;

  if (!occupied(i, j)) {
    GRID[ai][aj] = GRID_BLANK; // Clear Agents Previous Position
    ai = i;
    aj = j;
    GRID[ai][aj] = GRID_AGENT; // Store Agents Position

  }
}




// --- key handling --------------------------------------------------------------------------------------
// This is hard to see while the Mind is also moving the agent:
// AB.mind.getAction() and AB.world.takeAction() are constantly running in a loop at the same time
// have to turn off Mind actions to really see user key control

// we will handle these keys:

var OURKEYS = [37, 38, 39, 40];

function ourKeys(event) {
  return (OURKEYS.includes(event.keyCode));
}


function keyHandler(event) {
  if (!AB.runReady) return true; // not ready yet

  // if not one of our special keys, send it to default key handling:

  if (!ourKeys(event)) return true;

  // else handle key and prevent default handling:

  if (event.keyCode == 37) moveLogicalAgent(ACTION_LEFT);
  if (event.keyCode == 38) moveLogicalAgent(ACTION_DOWN);
  if (event.keyCode == 39) moveLogicalAgent(ACTION_RIGHT);
  if (event.keyCode == 40) moveLogicalAgent(ACTION_UP);

  // when the World is embedded in an iframe in a page, we want arrow key events handled by World and not passed up to parent

  event.stopPropagation();
  event.preventDefault();
  return false;
}





// --- score: -----------------------------------


function badstep() // is the enemy within one square of the agent
{
  if ((Math.abs(ei - ai) < 2) && (Math.abs(ej - aj) < 2)) return true;
  else return false;
}


function agentBlocked() // agent is blocked on all sides, run over
{
  return (occupied(ai - 1, aj) &&
    occupied(ai + 1, aj) &&
    occupied(ai, aj + 1) &&
    occupied(ai, aj - 1));
}


function updateStatusBefore(a)
// this is called before anyone has moved on this step, agent has just proposed an action
// update status to show old state and proposed move
{
  var x = AB.world.getState();
  AB.msg(" Step: " + AB.step + " &nbsp; x = (" + x.toString() + ") &nbsp; a = (" + a + ") ");
}


function updateStatusAfter() // agent and enemy have moved, can calculate score
{
  // new state after both have moved

  var y = AB.world.getState();
  var score = (goodsteps / AB.step) * 100;

  AB.msg(" &nbsp; y = (" + y.toString() + ") <br>" +
    " Bad steps: " + badsteps +
    " &nbsp; Good steps: " + goodsteps +
    " &nbsp; Score: " + score.toFixed(2) + "% ", 2);
}



function consoleGrid() {
  var gridString = "";

  for (var i = gridsize - 1; i >= 0; i--) {
    gridString = "";
    for (var j = 0; j < gridsize; j++) {
      switch (GRID[i][j]) {
        case GRID_WALL:
          gridString = gridString + "L";
          break;
        case GRID_MAZE:
          gridString = gridString + "X";
          break;
        case GRID_AGENT:
          gridString = gridString + "A";
          break;
        default:
          if (ej === j && ei === i) gridString = gridString + "e";
          else gridString = gridString + " ";
          break;
      }

    }
    console.log(gridString);
  }
  start.i = ei;
  start.j = ej;
  target.i = ai;
  target.j = aj;

  console.log("Heuristic: " + aStarHeuristics(start, target));
}


AB.world.newRun = function() {
  AB.loadingScreen();
  AB.runReady = false;

  badsteps = 0;
  goodsteps = 0;


  if (show3d) {
    BOXHEIGHT = squaresize;
    ABWorld.init3d(startRadiusConst, maxRadiusConst, SKYCOLOR);
  } else {
    BOXHEIGHT = 1;
    ABWorld.init2d(startRadiusConst, maxRadiusConst, SKYCOLOR);
  }


  loadResources(); // aynch file loads
  // calls initScene() when it returns

    // Initiailise A* Array
    aStarInit();
  document.onkeydown = keyHandler;

};



AB.world.getState = function() {
  var x = [ai, aj, ei, ej];
  return (x);
};



AB.world.takeAction = function(a) {
  updateStatusBefore(a); // show status line before moves

  moveLogicalAgent(a);

  if ((AB.step % 2) === 0) // slow the enemy down to every nth step
    moveLogicalEnemy();

  // consoleGrid();

  if (badstep()) badsteps++;
  else goodsteps++;

  drawAgent();
  drawEnemy();
  updateStatusAfter(); // show status line after moves


  if (agentBlocked()) // if agent blocked in, run over
  {
    AB.abortRun = true;
    goodsteps = 0; // you score zero as far as database is concerned
    //	musicPause();
    //	soundAlarm();
  }

};



AB.world.endRun = function() {
  //  musicPause();
  if (AB.abortRun) AB.msg(" <br> <font color=red> <B> Agent trapped. Final score zero. </B> </font>   ", 3);
  else AB.msg(" <br> <font color=green> <B> Run over. </B> </font>   ", 3);
};


AB.world.getScore = function() {
  // only called at end - do not use AB.step because it may have just incremented past AB.maxSteps

  var s = (goodsteps / AB.maxSteps) * 100; // float like 93.4372778
  var x = Math.round(s * 100); // 9344
  return (x / 100); // 93.44
};
