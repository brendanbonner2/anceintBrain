const gridsize = 15; // number of squares along side of world

const NOBOXES = Math.trunc((gridsize * gridsize) / 10);
// density of maze - number of internal boxes
// (bug) use trunc or can get a non-integer

const squaresize = 100; // size of square in pixels

const MAXPOS = gridsize * squaresize; // length of one side in pixels


// contents of a grid square

const GRID_BLANK = 0;
const GRID_WALL = 1;
const GRID_MAZE = 2;
const GRID_ENEMY = 10;
const GRID_AGENT = 20;

var GRID = new Array(gridsize); // can query GRID about whether squares are occupied, will in fact be initialised as a 2D array

var theagent, theenemy;

// enemy and agent position on squares
var ei, ej, ai, aj;

function coordinates(i, j) {
    this.i = i;
    this.j = j;
}
var start = new coordinates();
var target = new coordinates();

var badsteps;
var goodsteps;

var diagonal = false;

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


function iswall(i, j) // is this square occupied
{
    if (GRID[i][j] == GRID_WALL) return true; // fixed objects
    if (GRID[i][j] == GRID_MAZE) return true;

    return false;
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
            }
    else
        GRID[i][j] = GRID_BLANK;


    // set up maze

    for (var c = 1; c <= NOBOXES; c++) {
        i = Math.floor(Math.random() * (gridsize - 2) + 1); // inner squares are 1 to gridsize-2
        j = Math.floor(Math.random() * (gridsize - 2) + 1);

        GRID[i][j] = GRID_MAZE;
        // console.log("Maze Wall: " + i, ", ", j);
    }


    // set up enemy
    // start in random location

    do {
        i = Math.floor(Math.random() * (gridsize - 2) + 1);
        j = Math.floor(Math.random() * (gridsize - 2) + 1);
    }
    while (occupied(i, j)); // search for empty square

    ei = i;
    ej = j;

    //	 shape    = new THREE.BoxGeometry ( squaresize, BOXHEIGHT, squaresize );
    // set up agent
    // start in random location

    do {
        i = Math.floor(Math.random() * (gridsize - 2) + 1);
        j = Math.floor(Math.random() * (gridsize - 2) + 1);
    }
    while (occupied(i, j)); // search for empty square

    ai = i;
    aj = j;

    GRID[ai][aj] = GRID_AGENT;
    GRID[ei][ej] = GRID_ENEMY;

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
    this.closed = false; // are we in closed set

    // Figure out who my neighbors are
    this.addNeighbors = function () {
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
            // console.log("A* Initialise: " + i + ", " + j);
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
    var nextMove = new coordinates(start.i, start.j);

    openSet.push(startNode); // push startnode onto Openset
    startNode.f = 0; // reset first f value

    while ((openSet.length > 0) && !completed) {

        openSet.sort((a, b) => (a.f > b.f) ? 1 : -1); //sort set by f
        currentNode = openSet.shift(); // shift the first entry
        currentNode.closed = true; // quick check for closed
        //console.log("Current: " + currentNode.i + ", " + currentNode.j + " - (O/C) is " + +openSet.length + "/" + closedSet.length);
        if (currentNode == targetNode) {
            console.log("Start: " + start.i + ", " +start.j + ", Target: " + target.i +"," + target.j);
                
            while (currentNode.parent != startNode) {
                console.log(": " + currentNode.i + ", " + currentNode.j +" => " + currentNode.parent.i + ", " + currentNode.parent.j);
                currentNode = currentNode.parent;
            }
            completed = true;
            // backtrack to return the next move
        } else {
            for (n = 0; n < currentNode.neighbors.length; n++) {
                // for each of the neighbours, calculate the children
                child = currentNode.neighbors[n];

                // check if in closedSet or occupied
                if (child.closed) {
                    // move to next child
                } else if (iswall(child.i, child.j)) {
                    // closedSet.push(child);
                    child.closed = true;
                } else {
                    // calculate values and add to openSet
                    if ((child.i == currentNode.i) || (child.j == currentNode.j ))
                        child.g = currentNode.g + 10; // if not diagonal
                    else
                        child.g = currentNode.g + 14; // if diagonal

                    child.h = aStarHeuristics(child, targetNode);
                    child.f = child.g + child.h;
                    child.parent = currentNode;
                    openSet.push(child);

                } // check if closedSet
            } // loop through neighbours
        } //check if we have reached target
    }

    nextMove.i = currentNode.i;
    nextMove.j = currentNode.j;

    return nextMove;
    // end of openSet, and not completed.
}


function aStarHeuristics(start, end) {
    if (diagonal)
        return (Math.pow(start.i - end.i, 2) + Math.pow((start.j - end.j), 2));
    else
        return (Math.abs(start.i - start.i) + Math.abs(start.j - end.j));
}


// --- take actions -----------------------------------

function moveLogicalEnemy() {
    // move towards agent
    // put some randomness in so it won't get stuck with barriers

    //   console.log("moving enemy: " + ei + ", " + ej)
    var i, j;

    start.i = ei;
    start.j = ej;
    target.i = ai;
    target.j = aj;
    bestPath = aStar(GRID, start, target);
    
    // move enemy to new position
    ei = bestPath.i;
    ej = bestPath.j;

    console.log("moving enemy: " + ei + ", " + ej)

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
                case GRID_ENEMY:
                    gridString = gridString + "E";
                    break;
                default:
                    gridString = gridString + " ";
                    break;
            }

        }
        console.log(gridString);
    }
    start.i = ei;
    start.j = ej;
    target.i = ai;
    target.j = aj;

    // console.log("Heuristic: " + aStarHeuristics(start, target));
}


console.log("=====");
initScene();

badsteps = 0;
goodsteps = 0;

aStarInit();


getState = function () {
    var x = [ai, aj, ei, ej];
    return (x);
};

consoleGrid();

moveLogicalEnemy();
consoleGrid();