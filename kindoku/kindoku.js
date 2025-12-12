// Kindoku - Sudoku for Kindle
// Simple Sudoku game with generator and solver

// Game state
var board = [];         // Current board state (0 = empty)
var solution = [];      // Solution board
var given = [];         // Which cells are given (not editable)
var selectedCell = -1;  // Currently selected cell index

// DOM elements
var gridEl = document.getElementById('grid');
var statusEl = document.getElementById('status');

// Initialize the grid
function initGrid() {
    gridEl.innerHTML = '';
    for (var row = 0; row < 9; row++) {
        var rowEl = document.createElement('div');
        rowEl.className = 'row';
        for (var col = 0; col < 9; col++) {
            var cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = 'cell-' + (row * 9 + col);
            
            // Add box borders for 3x3 sections
            if (col === 2 || col === 5) {
                cell.className += ' box-right';
            }
            if (row === 2 || row === 5) {
                cell.className += ' box-bottom';
            }
            
            // Click handler
            (function(idx) {
                cell.onclick = function() {
                    selectCell(idx);
                };
            })(row * 9 + col);
            
            rowEl.appendChild(cell);
        }
        gridEl.appendChild(rowEl);
    }
}

// Select a cell
function selectCell(idx) {
    // Deselect previous
    if (selectedCell >= 0) {
        var prev = document.getElementById('cell-' + selectedCell);
        if (prev) prev.classList.remove('selected');
    }
    
    // Select new cell (only if not a given)
    if (!given[idx]) {
        selectedCell = idx;
        var cell = document.getElementById('cell-' + idx);
        if (cell) cell.classList.add('selected');
    } else {
        selectedCell = -1;
    }
}

// Enter a number in selected cell
function enterNumber(num) {
    if (selectedCell < 0) return;
    if (given[selectedCell]) return;
    
    board[selectedCell] = num;
    updateCell(selectedCell);
    statusEl.textContent = 'Playing...';
}

// Erase number from selected cell
function eraseNumber() {
    if (selectedCell < 0) return;
    if (given[selectedCell]) return;
    
    board[selectedCell] = 0;
    updateCell(selectedCell);
}

// Update a cell's display
function updateCell(idx) {
    var cell = document.getElementById('cell-' + idx);
    if (!cell) return;
    
    var val = board[idx];
    cell.textContent = val > 0 ? val : '';
    
    // Reset classes
    cell.classList.remove('error', 'user');
    
    if (given[idx]) {
        cell.classList.add('given');
    } else if (val > 0) {
        cell.classList.add('user');
    }
}

// Update all cells
function updateAllCells() {
    for (var i = 0; i < 81; i++) {
        updateCell(i);
    }
}

// Check if the current solution is correct
function checkSolution() {
    var complete = true;
    var errors = 0;
    
    for (var i = 0; i < 81; i++) {
        var cell = document.getElementById('cell-' + i);
        cell.classList.remove('error');
        
        if (board[i] === 0) {
            complete = false;
        } else if (board[i] !== solution[i]) {
            cell.classList.add('error');
            errors++;
        }
    }
    
    if (errors > 0) {
        statusEl.textContent = errors + ' error(s) found';
    } else if (!complete) {
        statusEl.textContent = 'Looking good so far!';
    } else {
        statusEl.textContent = 'Congratulations! Puzzle solved!';
    }
}

// Start a new game
function newGame(difficulty) {
    selectedCell = -1;
    statusEl.textContent = 'Generating puzzle...';
    
    // Use setTimeout to allow UI to update
    setTimeout(function() {
        generatePuzzle(difficulty);
        updateAllCells();
        statusEl.textContent = 'New ' + difficulty + ' puzzle - Good luck!';
    }, 10);
}

// ============================================
// SUDOKU GENERATOR AND SOLVER
// ============================================

// Generate a complete solved board
function generateSolvedBoard() {
    // Start with empty board
    var b = [];
    for (var i = 0; i < 81; i++) b[i] = 0;
    
    // Fill using backtracking with random choices
    solveBoardRandom(b);
    return b;
}

// Solve board with random number order (for generation)
function solveBoardRandom(b) {
    var empty = findEmpty(b);
    if (empty === -1) return true; // Solved
    
    // Try numbers in random order
    var nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    
    for (var i = 0; i < 9; i++) {
        var num = nums[i];
        if (isValid(b, empty, num)) {
            b[empty] = num;
            if (solveBoardRandom(b)) return true;
            b[empty] = 0;
        }
    }
    return false;
}

// Solve board deterministically (for checking uniqueness)
function solveBoard(b) {
    var empty = findEmpty(b);
    if (empty === -1) return true;
    
    for (var num = 1; num <= 9; num++) {
        if (isValid(b, empty, num)) {
            b[empty] = num;
            if (solveBoard(b)) return true;
            b[empty] = 0;
        }
    }
    return false;
}

// Find first empty cell
function findEmpty(b) {
    for (var i = 0; i < 81; i++) {
        if (b[i] === 0) return i;
    }
    return -1;
}

// Check if placing num at idx is valid
function isValid(b, idx, num) {
    var row = Math.floor(idx / 9);
    var col = idx % 9;
    
    // Check row
    for (var c = 0; c < 9; c++) {
        if (b[row * 9 + c] === num) return false;
    }
    
    // Check column
    for (var r = 0; r < 9; r++) {
        if (b[r * 9 + col] === num) return false;
    }
    
    // Check 3x3 box
    var boxRow = Math.floor(row / 3) * 3;
    var boxCol = Math.floor(col / 3) * 3;
    for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
            if (b[(boxRow + r) * 9 + (boxCol + c)] === num) return false;
        }
    }
    
    return true;
}

// Shuffle an array
function shuffle(arr) {
    var result = arr.slice();
    for (var i = result.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = result[i];
        result[i] = result[j];
        result[j] = temp;
    }
    return result;
}

// Generate a puzzle with given difficulty
function generatePuzzle(difficulty) {
    // Difficulty = number of cells to remove
    var removeCount;
    switch (difficulty) {
        case 'easy':   removeCount = 35; break;
        case 'medium': removeCount = 45; break;
        case 'hard':   removeCount = 55; break;
        default:       removeCount = 40;
    }
    
    // Generate a complete solution
    solution = generateSolvedBoard();
    
    // Copy solution to board
    board = solution.slice();
    
    // Remove cells to create puzzle
    var indices = [];
    for (var i = 0; i < 81; i++) indices[i] = i;
    indices = shuffle(indices);
    
    var removed = 0;
    for (var i = 0; i < indices.length && removed < removeCount; i++) {
        var idx = indices[i];
        var backup = board[idx];
        board[idx] = 0;
        
        // For hard puzzles, just remove without checking uniqueness
        // (checking uniqueness is slow and may not work well on Kindle)
        removed++;
    }
    
    // Mark given cells
    given = [];
    for (var i = 0; i < 81; i++) {
        given[i] = board[i] > 0;
    }
}

// Count solutions (for uniqueness check - not used on Kindle for performance)
function countSolutions(b, limit) {
    var empty = findEmpty(b);
    if (empty === -1) return 1;
    
    var count = 0;
    for (var num = 1; num <= 9; num++) {
        if (isValid(b, empty, num)) {
            b[empty] = num;
            count += countSolutions(b, limit);
            b[empty] = 0;
            if (count >= limit) return count;
        }
    }
    return count;
}

// Keyboard support for desktop
document.addEventListener('keydown', function(e) {
    var key = e.key || String.fromCharCode(e.keyCode);
    
    if (key >= '1' && key <= '9') {
        enterNumber(parseInt(key, 10));
    } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
        eraseNumber();
    } else if (key === 'ArrowUp' && selectedCell >= 9) {
        selectCell(selectedCell - 9);
    } else if (key === 'ArrowDown' && selectedCell < 72 && selectedCell >= 0) {
        selectCell(selectedCell + 9);
    } else if (key === 'ArrowLeft' && selectedCell > 0) {
        selectCell(selectedCell - 1);
    } else if (key === 'ArrowRight' && selectedCell < 80 && selectedCell >= 0) {
        selectCell(selectedCell + 1);
    }
});

// Initialize on load
initGrid();
