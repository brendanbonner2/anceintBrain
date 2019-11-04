const diagonal = false;

// Open and closed set
var openSet = [];
var closedSet = [];
var pathFound = [];

// Start and end
var start;
var end;


function aStar() {

  // globals: GRID - array of arrays [][]
  // globals: enemy x,y: ai,aj, agent: ai, aj


  // find shortest path
  while (!complete) {

    // --- begin still searching -----------------------------
    if (openSet.length > 0) {

      // Best next option
      var winner = 0;

      for (var i = 0; i < openSet.length; i++)
        if (openSet[i].f < openSet[winner].f)
          winner = i;

      var current = openSet[winner];

      // Did I finish?
      if (current === end) {
        console.log("success - found path");
        complete = true;
      }

      // Best option moves from openSet to closedSet
      removeFromArray(openSet, current);
      closedSet.push(current);

      // Check all the neighbors
      var neighbors = current.neighbors;

      //--- start of for loop -----------
      for (i = 0; i < neighbors.length; i++) {
        var neighbor = neighbors[i];

        // Valid next spot?
        if (!closedSet.includes(neighbor) && !neighbor.wall) {
          var tempG = current.g + aStarHeuristics(neighbor, current);

          // Is this a better path than before?
          var newPath = false;
          if (openSet.includes(neighbor)) {
            if (tempG < neighbor.g) {
              neighbor.g = tempG;
              newPath = true;
            }
          } else {
            neighbor.g = tempG;
            newPath = true;
            openSet.push(neighbor);
          }

          // Yes, it's a better path
          if (newPath) {
            neighbor.h = heuristic(neighbor, end);
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.previous = current;
          }
        }
      }
      //--- end of for loop -----------

    }
    // --- end still searching -----------------------------
    else {
      console.log('fail - no path exists');
      complete = true;
    }
  }
  // move to next space
  ei = target_i;
  ej = target_j;
}

function aStarHeuristics() {


  if (diagonal) {
    return (dist(ai, aj, ei, ej));
  } else {
    return (abs(ei - ei) + abs(aj - ej));
  }
}
