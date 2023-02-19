let canvas, rows, cols;
let xstep, ystep;
let grid = [];
let defaultRows = 20;
let defaultCols = 40;

// render queue for path visuals
let pathRenderQueue = [];
let visitedRenderQueue = [];

//frame rate mod factor ex (rameCount % speed == 0)
let speed = 1;

let play = true;

//decides which algorithm to use for pathfinding
let algorithm = 1;

let executionTime = '---';

function setup(){
    let cw = document.getElementById('canvas').offsetWidth;
    let ch = document.getElementById('canvas').offsetHeight;
    canvas = createCanvas(cw, ch);
    canvas.parent('canvas');
    rows = defaultRows;
    cols = defaultCols;
    initGrid();
    xstep = width / cols;
    ystep = height / rows
}

function draw(){
    background(0);
    updateSpeed();
    drawGrid();
    drawNodes();
    if(play == true)
        drawVisual(algorithm);
}

function drawVisual(algo){
    let showAmount = null;

    //depending on algorithm you may want to show chunks of the queue at one time
    if(algo == 1){
        showAmount = 4;
    }else if(algo == 2){
        showAmount = 1;
    }else if(algo == 3){
        showAmount = 1;
    }

    //draw visited nodes first
    if(visitedRenderQueue.length > 0 && frameCount % speed == 0){
        for(let i = 0; i < showAmount; i++){
            if(visitedRenderQueue.length > 0){
                let current = visitedRenderQueue.shift();
                current.value = 5;
            }
        }
    }

    //draw path nodes second
    else if(pathRenderQueue.length > 0 && frameCount % speed == 0){
        let current = pathRenderQueue.pop();
        current.value = 4;
    }
}

function windowResized(){
    let cw = document.getElementById('canvas').offsetWidth;
    let ch = document.getElementById('canvas').offsetHeight;
    canvas = resizeCanvas(cw, ch);
    xstep = width / cols;
    ystep = height / rows
    initGrid();
}

function initGrid(){
    //read in the input from the user. If the number give > 0 use it, otherwise use the default values
    let rowInput = Math.round(document.getElementById('rows').value);
    rows = rowInput >= 5 ? rowInput : defaultRows;
    let colInput = Math.round(document.getElementById('cols').value);
    cols = colInput >= 5 ? colInput : defaultCols;

    //update the size of the blocks/nodes
    xstep = width / cols;
    ystep = height / rows

    //init a new grid
    grid = [];
    for(let i = 0; i < rows; i++){
        grid.push([]);
        for(let j = 0; j < cols; j++){
            grid[i].push(new Node(j, i, 0));
        }
    }

    grid[1][1].value = 1;
    grid[rows - 2][cols - 2].value = 2;
}

function drawGrid(){
    for(let i = 0; i < rows; i++){
        for(let j = 0; j < cols; j++){
            push();

            //empty node
            if(grid[i][j].value == 0){
                stroke(221, 221, 221);
                fill(255);
            }

            //start node
            else if(grid[i][j].value == 1){
                noStroke();
                fill(158, 182, 150)
            }

            //finish node
            else if(grid[i][j].value == 2){
                noStroke();
                fill(216, 108, 112);
            }

            //wall node
            else if(grid[i][j].value == 3){
                fill(0);
            }

            //path node
            if(grid[i][j].value == 4){
                stroke(216,216,134);
                fill(252,252,159);
            } 

            //visited node
            else if(grid[i][j].value == 5){
                stroke(61,102,140);
                fill(87,142,193);
            }

            rect(j * xstep, i * ystep, xstep, ystep);

            pop();
        }
    }
}

function drawNodes(){
    //mouse is not pressed
    if(!mouseIsPressed)
        return

    let x = Math.floor(mouseX / xstep);
    let y = Math.floor(mouseY / ystep);

    //not inside the canvas
    if(x < 0 || x > cols-1 || y < 0 || y > rows-1)
        return

    //clear any path nodes and empty the render queue
    pathRenderQueue = [];
    for(let i = 0; i < grid.length; i++){
        for(let j = 0; j < grid[i].length; j++){
            if(grid[i][j].value == 4)
                grid[i][j].value = 0;
        }
    }

    //clear any visited nodes and empty the render queue
    visitedRenderQueue = [];
    for(let i = 0; i < grid.length; i++){
        for(let j = 0; j < grid[i].length; j++){
            if(grid[i][j].value == 5)
                grid[i][j].value = 0;
        }
    }

    //if the shift key is down, it clears any node underneath the cursor
    if(keyIsDown(16)){

        //set the node under the cursor to blank
        grid[y][x].value = 0;
        return;
    }

    //get the radio buttons
    let radios = document.getElementsByName('node-type');
    let value = 0;

    for(let i = 0; i < radios.length; i++) {
        if(radios[i].checked){
            value = radios[i].value;
        }
    }

    //if they are choosing a new start/finish node, reset the previous start/finish node
    if(value == 1 || value == 2){
        for(let i = 0; i < grid.length; i++){
            for(let j = 0; j < grid[i].length; j++){
                if(grid[i][j].value == value)
                    grid[i][j].value = 0;
            }
        }
    }

    grid[y][x].value = value;
}

function startSearch(){
    pathRenderQueue = [];
    visitedRenderQueue = [];
    play = true;

    if(getStartNode() == null || getFinishNode() == null){
        alert('Place both a start and finish node before starting!');
        return;
    }

    for(let i = 0; i < grid.length; i++){
        for(let j = 0; j < grid[i].length; j++){
            grid[i][j].parent = null;
            grid[i][j].visited = false;
            if(grid[i][j].value == 4 || grid[i][j].value == 5)
                grid[i][j].value = 0;
        }
    }

    let algorithmDrop = document.getElementById('algorithm-choice');
    algorithm = algorithmDrop.options[algorithmDrop.selectedIndex].value;

    instantaneous = speed == 0 ? true : false;

    //bfs
    if(algorithm == 1){
        bfs(instantaneous);
    }

    //dfs
    else if(algorithm == 2){
        dfs(instantaneous);
    }

}

//returns the location of the starting node
function getStartNode(){
    for(let i = 0; i < grid.length; i++){
        for(let j = 0; j < grid[i].length; j++){
            if(grid[i][j].value == 1)
                return grid[i][j];
        }
    }

    return null;
}

//returns the location of the finish node
function getFinishNode(){
    for(let i = 0; i < grid.length; i++){
        for(let j = 0; j < grid[i].length; j++){
            if(grid[i][j].value == 2)
                return grid[i][j];
        }
    }

    return null;
}

function bfs(instantaneous){
    let queue = [];
    let startNode = getStartNode();
    startNode.visited = true;
    queue.push(startNode);

    let current = null;
    while(queue.length > 0){
        current = queue.shift();

        if(current.equals(getFinishNode())){
            break;
        }

        //north
        if(current.y > 0 && !grid[current.y-1][current.x].visited && grid[current.y-1][current.x].value != 3){
            let neighbor = grid[current.y-1][current.x];
            visitedRenderQueue.push(neighbor);
            neighbor.visited = true;
            neighbor.parent = current;
            queue.push(neighbor);
        }

        //south
        if(current.y < rows-1 && !grid[current.y+1][current.x].visited && grid[current.y+1][current.x].value != 3){
            let neighbor = grid[current.y+1][current.x];
            visitedRenderQueue.push(neighbor);
            neighbor.visited = true;
            neighbor.parent = current;
            queue.push(neighbor);
        }

        //east
        if(current.x < cols-1 && !grid[current.y][current.x+1].visited && grid[current.y][current.x+1].value != 3){
            let neighbor = grid[current.y][current.x+1];
            visitedRenderQueue.push(neighbor);
            neighbor.visited = true;
            neighbor.parent = current;
            queue.push(neighbor);
        }

        //west
        if(current.x > 0 && !grid[current.y][current.x-1].visited && grid[current.y][current.x-1].value != 3){
            let neighbor = grid[current.y][current.x-1];
            visitedRenderQueue.push(neighbor);
            neighbor.visited = true;
            neighbor.parent = current;
            queue.push(neighbor);
        }
    }

    //instantly render if the user wants that
    if(instantaneous){
        pathRenderQueue = [];
        visitedRenderQueue = [];
        current = current.parent;
        while(current.parent != null){
            current.value = 4;
            current = current.parent;
        }
    }

    //remove the finish node from the visited list (for rendering purposes)
    for(let i = 0; i < visitedRenderQueue.length; i++){
        if(visitedRenderQueue[i].value == 2){
            visitedRenderQueue.splice(i, 1);
        }
    }

    pathRenderQueue = [];
    if(!current.equals(getFinishNode())){
        return null;
    }
    current = current.parent;
    while(current.parent != null){
        pathRenderQueue.push(current);
        current = current.parent;
    }
}

function dfs(){

    let finishNode = getFinishNode();
    let current = null;
    let stack = [getStartNode()];

    while(stack.length > 0){
        current = stack.pop();

        if(current.equals(finishNode)){
            current = current.parent;
            while(current.parent != null){
                pathRenderQueue.push(current);
                current = current.parent;
            }
            break;
        }

        if(!current.visited){
            current.visited = true;

            //add to the render queue except for the start node
            if(current.value != 1)
                visitedRenderQueue.push(current);

            //north
            if(current.y > 0 && !grid[current.y-1][current.x].visited && grid[current.y-1][current.x].value != 3){
                let neighbor = grid[current.y-1][current.x];
                neighbor.parent = current;
                stack.push(neighbor);
            }

            //south
            if(current.y < rows-1 && !grid[current.y+1][current.x].visited && grid[current.y+1][current.x].value != 3){
                let neighbor = grid[current.y+1][current.x];
                neighbor.parent = current;
                stack.push(neighbor);
            }

            //east
            if(current.x < cols-1 && !grid[current.y][current.x+1].visited && grid[current.y][current.x+1].value != 3){
                let neighbor = grid[current.y][current.x+1];
                neighbor.parent = current;
                stack.push(neighbor);
            }

            //west
            if(current.x > 0 && !grid[current.y][current.x-1].visited && grid[current.y][current.x-1].value != 3){
                let neighbor = grid[current.y][current.x-1];
                neighbor.parent = current;
                stack.push(neighbor);
            }
        }
    }

    return current;
}



function toggleHelpMenu(){
    let helpMenu = document.getElementById('help-menu');
    helpMenu.style.visibility = helpMenu.style.visibility == 'hidden' || helpMenu.style.visibility == '' ? 'visible' : 'hidden';
}


function togglePlay(){
    play = !play;
}

function updateSpeed(){
    let val = document.getElementById('speed-slider').value;
    if(val == 0){
        speed = 0;
        return;
    }

    val = Math.abs(document.getElementById('speed-slider').max - val) + 1;
    speed = val;
}

function instantPath(){
    if(getStartNode() == null || getFinishNode() == null){
        alert('Place both a start and finish node before starting!');
        return;
    }

    for(let i = 0; i < grid.length; i++){
        for(let j = 0; j < grid[i].length; j++){
            grid[i][j].parent = null;
            grid[i][j].visited = false;
            if(grid[i][j].value == 4 || grid[i][j].value == 5)
                grid[i][j].value = 0;
        }
    }

    bfs(true);
}