// Minesweeper for Kindle
// Classic mine-finding puzzle game

// Game state
var width = 9;
var height = 9;
var mineCount = 10;
var isMine = [];
var isRevealed = [];
var isFlagged = [];
var adjacentCount = [];
var gameOver = false;
var gameWon = false;
var firstClick = true;
var mode = 'dig'; // 'dig' or 'flag'
var revealedCount = 0;
var flaggedCount = 0;

// DOM elements
var gridEl = document.getElementById('grid');
var statusEl = document.getElementById('status');
var mineCountEl = document.getElementById('mineCount');
var flagCountEl = document.getElementById('flagCount');
var digBtn = document.getElementById('digBtn');
var flagBtn = document.getElementById('flagBtn');

// Initialize the grid
function initGrid() {
    gridEl.innerHTML = '';
    for (var row = 0; row < height; row++) {
        var rowEl = document.createElement('div');
        rowEl.className = 'row';
        rowEl.style.height = '26px';
        for (var col = 0; col < width; col++) {
            var cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = 'cell-' + (row * width + col);
            
            // Click handler
            (function(idx) {
                cell.onclick = function() {
                    handleClick(idx);
                };
            })(row * width + col);
            
            rowEl.appendChild(cell);
        }
        gridEl.appendChild(rowEl);
    }
}

// Set game mode
function setMode(newMode) {
    mode = newMode;
    if (mode === 'dig') {
        digBtn.classList.add('active');
        flagBtn.classList.remove('active');
    } else {
        digBtn.classList.remove('active');
        flagBtn.classList.add('active');
    }
}

// Handle cell click
function handleClick(idx) {
    if (gameOver || gameWon) return;
    
    if (mode === 'flag') {
        toggleFlag(idx);
    } else {
        reveal(idx);
    }
}

// Toggle flag on cell
function toggleFlag(idx) {
    if (isRevealed[idx]) return;
    
    isFlagged[idx] = !isFlagged[idx];
    flaggedCount += isFlagged[idx] ? 1 : -1;
    updateCell(idx);
    updateInfo();
}

// Reveal a cell
function reveal(idx) {
    if (isRevealed[idx] || isFlagged[idx]) return;
    
    // First click - generate mines avoiding this cell
    if (firstClick) {
        generateMines(idx);
        firstClick = false;
    }
    
    // Check for mine
    if (isMine[idx]) {
        // Game over
        gameOver = true;
        isRevealed[idx] = true;
        var cell = document.getElementById('cell-' + idx);
        cell.classList.add('exploded');
        cell.textContent = '✱';
        revealAllMines();
        statusEl.textContent = 'BOOM! Game Over';
        return;
    }
    
    // Reveal cell
    isRevealed[idx] = true;
    revealedCount++;
    updateCell(idx);
    
    // Flood-fill for empty cells
    if (adjacentCount[idx] === 0) {
        floodFill(idx);
    }
    
    // Check for win
    checkWin();
}

// Flood-fill reveal for empty cells (iterative to avoid stack overflow)
function floodFill(startIdx) {
    var stack = [startIdx];
    
    while (stack.length > 0) {
        var idx = stack.pop();
        var neighbors = getNeighbors(idx);
        
        for (var i = 0; i < neighbors.length; i++) {
            var n = neighbors[i];
            if (!isRevealed[n] && !isFlagged[n]) {
                isRevealed[n] = true;
                revealedCount++;
                updateCell(n);
                
                if (adjacentCount[n] === 0) {
                    stack.push(n);
                }
            }
        }
    }
}

// Get neighbor indices
function getNeighbors(idx) {
    var neighbors = [];
    var row = Math.floor(idx / width);
    var col = idx % width;
    
    for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            var nr = row + dr;
            var nc = col + dc;
            if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
                neighbors.push(nr * width + nc);
            }
        }
    }
    return neighbors;
}

// Generate mines (avoiding first clicked cell and its neighbors)
function generateMines(safeIdx) {
    var safeZone = [safeIdx].concat(getNeighbors(safeIdx));
    var totalCells = width * height;
    
    // Reset mine array
    isMine = [];
    for (var i = 0; i < totalCells; i++) {
        isMine[i] = false;
    }
    
    // Place mines
    var minesPlaced = 0;
    while (minesPlaced < mineCount) {
        var idx = Math.floor(Math.random() * totalCells);
        
        // Check if this is a safe zone or already a mine
        var isSafe = false;
        for (var i = 0; i < safeZone.length; i++) {
            if (safeZone[i] === idx) {
                isSafe = true;
                break;
            }
        }
        
        if (!isSafe && !isMine[idx]) {
            isMine[idx] = true;
            minesPlaced++;
        }
    }
    
    // Calculate adjacent counts
    calculateAdjacent();
}

// Calculate adjacent mine counts
function calculateAdjacent() {
    var totalCells = width * height;
    adjacentCount = [];
    
    for (var i = 0; i < totalCells; i++) {
        if (isMine[i]) {
            adjacentCount[i] = 0;
            continue;
        }
        
        var count = 0;
        var neighbors = getNeighbors(i);
        for (var j = 0; j < neighbors.length; j++) {
            if (isMine[neighbors[j]]) {
                count++;
            }
        }
        adjacentCount[i] = count;
    }
}

// Update cell display
function updateCell(idx) {
    var cell = document.getElementById('cell-' + idx);
    if (!cell) return;
    
    // Reset classes
    cell.className = 'cell';
    cell.textContent = '';
    
    if (isRevealed[idx]) {
        cell.classList.add('revealed');
        if (isMine[idx]) {
            cell.classList.add('mine');
            cell.textContent = '✱';
        } else if (adjacentCount[idx] > 0) {
            cell.classList.add('n' + adjacentCount[idx]);
            cell.textContent = adjacentCount[idx];
        }
    } else if (isFlagged[idx]) {
        cell.classList.add('flagged');
        cell.textContent = '⚑';
    }
}

// Reveal all mines (game over)
function revealAllMines() {
    var totalCells = width * height;
    for (var i = 0; i < totalCells; i++) {
        if (isMine[i] && !isRevealed[i]) {
            isRevealed[i] = true;
            updateCell(i);
        }
    }
}

// Check for win condition
function checkWin() {
    var totalCells = width * height;
    var nonMineCells = totalCells - mineCount;
    
    if (revealedCount === nonMineCells) {
        gameWon = true;
        statusEl.textContent = 'You Win! All mines found!';
        // Flag remaining mines
        for (var i = 0; i < totalCells; i++) {
            if (isMine[i] && !isFlagged[i]) {
                isFlagged[i] = true;
                flaggedCount++;
                updateCell(i);
            }
        }
        updateInfo();
    }
}

// Update info bar
function updateInfo() {
    mineCountEl.textContent = 'Mines: ' + mineCount;
    flagCountEl.textContent = 'Flags: ' + flaggedCount;
}

// Start new game
function newGame(w, h, mines) {
    width = w;
    height = h;
    mineCount = mines;
    
    var totalCells = width * height;
    
    // Reset state
    isMine = [];
    isRevealed = [];
    isFlagged = [];
    adjacentCount = [];
    gameOver = false;
    gameWon = false;
    firstClick = true;
    revealedCount = 0;
    flaggedCount = 0;
    
    for (var i = 0; i < totalCells; i++) {
        isMine[i] = false;
        isRevealed[i] = false;
        isFlagged[i] = false;
        adjacentCount[i] = 0;
    }
    
    // Reset to dig mode
    setMode('dig');
    
    // Build grid
    initGrid();
    updateInfo();
    statusEl.textContent = 'Click a cell to start!';
}

// Keyboard support
document.addEventListener('keydown', function(e) {
    var key = e.key || String.fromCharCode(e.keyCode);
    
    if (key === 'd' || key === 'D') {
        setMode('dig');
    } else if (key === 'f' || key === 'F') {
        setMode('flag');
    }
});

// Initialize with default game
initGrid();
