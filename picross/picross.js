// Picross for Kindle
// Nonogram picture puzzle game

// Game state
var size = 5;
var grid = [];       // Player's current state: 0=empty, 1=filled, 2=marked X
var solution = [];   // The correct answer: 0 or 1
var rowHints = [];   // Hints for each row
var colHints = [];   // Hints for each column
var maxRowHints = 0;
var maxColHints = 0;
var mode = 'fill';   // 'fill' or 'mark'

// DOM elements
var gridContainer = document.getElementById('gridContainer');
var statusEl = document.getElementById('status');
var fillBtn = document.getElementById('fillBtn');
var markBtn = document.getElementById('markBtn');

// Set game mode
function setMode(newMode) {
    mode = newMode;
    if (mode === 'fill') {
        fillBtn.classList.add('active');
        markBtn.classList.remove('active');
    } else {
        fillBtn.classList.remove('active');
        markBtn.classList.add('active');
    }
}

// Generate a random solution
function generateSolution() {
    solution = [];
    // Generate random pattern with ~40-60% filled
    for (var i = 0; i < size * size; i++) {
        solution[i] = Math.random() < 0.5 ? 1 : 0;
    }
    
    // Make sure there's at least one filled cell in each row and column
    for (var i = 0; i < size; i++) {
        // Check row
        var rowHasOne = false;
        for (var j = 0; j < size; j++) {
            if (solution[i * size + j] === 1) {
                rowHasOne = true;
                break;
            }
        }
        if (!rowHasOne) {
            solution[i * size + Math.floor(Math.random() * size)] = 1;
        }
        
        // Check column
        var colHasOne = false;
        for (var j = 0; j < size; j++) {
            if (solution[j * size + i] === 1) {
                colHasOne = true;
                break;
            }
        }
        if (!colHasOne) {
            solution[Math.floor(Math.random() * size) * size + i] = 1;
        }
    }
}

// Calculate hints from solution
function calculateHints() {
    rowHints = [];
    colHints = [];
    maxRowHints = 0;
    maxColHints = 0;
    
    // Row hints
    for (var row = 0; row < size; row++) {
        var hints = [];
        var count = 0;
        for (var col = 0; col < size; col++) {
            if (solution[row * size + col] === 1) {
                count++;
            } else if (count > 0) {
                hints.push(count);
                count = 0;
            }
        }
        if (count > 0) hints.push(count);
        if (hints.length === 0) hints.push(0);
        rowHints.push(hints);
        if (hints.length > maxRowHints) maxRowHints = hints.length;
    }
    
    // Column hints
    for (var col = 0; col < size; col++) {
        var hints = [];
        var count = 0;
        for (var row = 0; row < size; row++) {
            if (solution[row * size + col] === 1) {
                count++;
            } else if (count > 0) {
                hints.push(count);
                count = 0;
            }
        }
        if (count > 0) hints.push(count);
        if (hints.length === 0) hints.push(0);
        colHints.push(hints);
        if (hints.length > maxColHints) maxColHints = hints.length;
    }
}

// Build the grid with hints
function buildGrid() {
    gridContainer.innerHTML = '';
    
    // Create table
    var table = document.createElement('table');
    table.className = 'grid-table';
    
    // Column hint rows
    for (var hintRow = 0; hintRow < maxColHints; hintRow++) {
        var tr = document.createElement('tr');
        
        // Corner cells
        for (var i = 0; i < maxRowHints; i++) {
            var td = document.createElement('td');
            td.className = 'hint-cell corner-cell';
            tr.appendChild(td);
        }
        
        // Column hints
        for (var col = 0; col < size; col++) {
            var td = document.createElement('td');
            td.className = 'hint-cell col-hint';
            
            // Get hint for this position
            var hints = colHints[col];
            var hintIdx = hintRow - (maxColHints - hints.length);
            if (hintIdx >= 0 && hintIdx < hints.length) {
                td.textContent = hints[hintIdx];
            }
            
            // Box border
            if ((col + 1) % 5 === 0 && col < size - 1) {
                td.className += ' box-right';
            }
            
            tr.appendChild(td);
        }
        
        table.appendChild(tr);
    }
    
    // Game rows
    for (var row = 0; row < size; row++) {
        var tr = document.createElement('tr');
        
        // Row hints
        var hints = rowHints[row];
        for (var i = 0; i < maxRowHints; i++) {
            var td = document.createElement('td');
            td.className = 'hint-cell row-hint';
            
            var hintIdx = i - (maxRowHints - hints.length);
            if (hintIdx >= 0 && hintIdx < hints.length) {
                td.textContent = hints[hintIdx];
            }
            
            tr.appendChild(td);
        }
        
        // Game cells
        for (var col = 0; col < size; col++) {
            var td = document.createElement('td');
            td.className = 'game-cell';
            td.id = 'cell-' + (row * size + col);
            
            // Box borders
            if ((col + 1) % 5 === 0 && col < size - 1) {
                td.className += ' box-right';
            }
            if ((row + 1) % 5 === 0 && row < size - 1) {
                td.className += ' box-bottom';
            }
            
            // Click handler
            (function(idx) {
                td.onclick = function() {
                    handleClick(idx);
                };
            })(row * size + col);
            
            tr.appendChild(td);
        }
        
        // Box border on last hint cell
        if ((row + 1) % 5 === 0 && row < size - 1) {
            var hintCells = tr.querySelectorAll('.row-hint');
            for (var i = 0; i < hintCells.length; i++) {
                hintCells[i].className += ' box-bottom';
            }
        }
        
        table.appendChild(tr);
    }
    
    gridContainer.appendChild(table);
}

// Handle cell click
function handleClick(idx) {
    if (mode === 'fill') {
        // Toggle: empty -> filled -> empty
        if (grid[idx] === 1) {
            grid[idx] = 0;
        } else {
            grid[idx] = 1;
        }
    } else {
        // Toggle: empty -> marked -> empty
        if (grid[idx] === 2) {
            grid[idx] = 0;
        } else {
            grid[idx] = 2;
        }
    }
    updateCell(idx);
}

// Update cell display
function updateCell(idx) {
    var cell = document.getElementById('cell-' + idx);
    if (!cell) return;
    
    cell.classList.remove('filled', 'marked');
    cell.textContent = '';
    
    if (grid[idx] === 1) {
        cell.classList.add('filled');
    } else if (grid[idx] === 2) {
        cell.classList.add('marked');
        cell.textContent = '✕';
    }
}

// Check solution
function checkSolution() {
    var correct = true;
    var errors = 0;
    
    for (var i = 0; i < size * size; i++) {
        var playerFilled = (grid[i] === 1);
        var shouldBeFilled = (solution[i] === 1);
        
        if (playerFilled !== shouldBeFilled) {
            correct = false;
            errors++;
        }
    }
    
    if (correct) {
        statusEl.textContent = 'Perfect! Puzzle solved!';
    } else {
        statusEl.textContent = errors + ' cell(s) incorrect';
    }
}

// Start new game
function newGame(newSize) {
    size = newSize;
    
    // Reset grid
    grid = [];
    for (var i = 0; i < size * size; i++) {
        grid[i] = 0;
    }
    
    // Generate puzzle
    generateSolution();
    calculateHints();
    
    // Build UI
    buildGrid();
    setMode('fill');
    statusEl.textContent = 'Fill in the picture!';
}

// Initialize
buildGrid();
