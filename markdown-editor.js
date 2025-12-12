// State variables
var ctrlPressed = false;
var shiftPressed = false;
var isPreviewMode = false;
var autoSaveTimer = null;
var selectionAnchor = null; // Track selection anchor for shift+arrow

// DOM elements
var editor = document.getElementById('editor');
var preview = document.getElementById('preview');
var ctrlBtn = document.getElementById('ctrlBtn');
var shiftBtn = document.getElementById('shiftBtn');
var previewBtn = document.getElementById('previewBtn');
var wordCountEl = document.getElementById('wordCount');
var charCountEl = document.getElementById('charCount');
var saveStatus = document.getElementById('saveStatus');

// Simple markdown parser optimized for Kindle
function parseMarkdown(text) {
    if (!text) return '';
    
    // Escape HTML
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Code blocks (must be before inline code)
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Headers
    text = text.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    text = text.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    text = text.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    
    // Horizontal rules
    text = text.replace(/^---$/gm, '<hr>');
    text = text.replace(/^\*\*\*$/gm, '<hr>');
    
    // Bold and italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
    text = text.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Strikethrough
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // Inline code
    text = text.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
    
    // Images
    text = text.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1">');
    
    // Lists - supports nested lists with indentation
    var lines = text.split('\n');
    var result = [];
    var listStack = []; // Stack of {type: 'ul'|'ol', indent: number}
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        
        // Check for list item (unordered or ordered) with any indentation
        var ulMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
        var olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        
        if (ulMatch || olMatch) {
            var indent = (ulMatch ? ulMatch[1] : olMatch[1]).length;
            var listType = ulMatch ? 'ul' : 'ol';
            var content = ulMatch ? ulMatch[3] : olMatch[3];
            
            // Close lists that are more indented than current
            while (listStack.length > 0 && listStack[listStack.length - 1].indent > indent) {
                result.push('</' + listStack.pop().type + '>');
            }
            
            // Check if we need a new list
            if (listStack.length === 0 || listStack[listStack.length - 1].indent < indent) {
                // Start new nested list
                result.push('<' + listType + '>');
                listStack.push({type: listType, indent: indent});
            } else if (listStack[listStack.length - 1].type !== listType) {
                // Same indent but different type - close old, open new
                result.push('</' + listStack.pop().type + '>');
                result.push('<' + listType + '>');
                listStack.push({type: listType, indent: indent});
            }
            
            result.push('<li>' + content + '</li>');
        } else {
            // Not a list item - close all open lists
            while (listStack.length > 0) {
                result.push('</' + listStack.pop().type + '>');
            }
            if (line.trim()) {
                result.push('<p>' + line + '</p>');
            }
        }
    }
    
    // Close any remaining open lists
    while (listStack.length > 0) {
        result.push('</' + listStack.pop().type + '>');
    }
    
    text = result.join('\n');
    
    // Blockquotes
    text = text.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    
    return text;
}

// Update preview and status
function updatePreview() {
    preview.innerHTML = parseMarkdown(editor.value);
    updateStatus();
    scheduleAutoSave();
}

// Update word and character count
function updateStatus() {
    var text = editor.value;
    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    var chars = text.length;
    wordCountEl.textContent = 'Words: ' + words;
    charCountEl.textContent = 'Characters: ' + chars;
}

// Schedule auto-save
function scheduleAutoSave() {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    autoSaveTimer = setTimeout(function() {
        saveToStorage();
    }, 2000);
}

// Save to localStorage
function saveToStorage() {
    try {
        localStorage.setItem('kindleMarkdown', editor.value);
        saveStatus.textContent = 'Saved';
        setTimeout(function() {
            saveStatus.textContent = 'Ready';
        }, 2000);
    } catch (e) {
        saveStatus.textContent = 'Storage error';
    }
}

// Load from localStorage
function loadFromStorage() {
    try {
        var saved = localStorage.getItem('kindleMarkdown');
        if (saved) {
            editor.value = saved;
            updatePreview();
        }
    } catch (e) {
        console.log('Could not load from storage');
    }
}

// Insert markdown syntax
function insertMarkdown(before, after) {
    var start = editor.selectionStart;
    var end = editor.selectionEnd;
    var text = editor.value;
    var selectedText = text.substring(start, end) || 'text';
    var replacement = before + selectedText + after;
    editor.value = text.substring(0, start) + replacement + text.substring(end);
    
    var newPos = start + before.length + selectedText.length;
    editor.setSelectionRange(newPos, newPos);
    editor.focus();
    updatePreview();
    closeAllMenus();
}

// Insert table
function insertTable() {
    var start = editor.selectionStart;
    var text = editor.value;
    var tableText = '\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n\n';
    editor.value = text.substring(0, start) + tableText + text.substring(start);
    editor.setSelectionRange(start + tableText.length, start + tableText.length);
    editor.focus();
    updatePreview();
    closeAllMenus();
}

// Insert image
function insertImage() {
    var url = prompt('Enter image URL:');
    if (url) {
        var start = editor.selectionStart;
        var text = editor.value;
        var imageText = '![alt text](' + url + ')';
        editor.value = text.substring(0, start) + imageText + text.substring(start);
        editor.setSelectionRange(start + imageText.length, start + imageText.length);
        editor.focus();
        updatePreview();
    }
    closeAllMenus();
}

// Save to file
function saveToFile() {
    var text = editor.value;
    var blob = new Blob([text], { type: 'text/markdown' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'document.md';
    a.click();
    saveStatus.textContent = 'Saved to file';
    setTimeout(function() {
        saveStatus.textContent = 'Ready';
    }, 2000);
    closeAllMenus();
}

// Load file
function loadFile(event) {
    var file = event.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            editor.value = e.target.result;
            updatePreview();
            saveStatus.textContent = 'File loaded';
            setTimeout(function() {
                saveStatus.textContent = 'Ready';
            }, 2000);
        };
        reader.readAsText(file);
    }
    closeAllMenus();
}

// Clear editor
function clearEditor() {
    if (confirm('Are you sure you want to clear the editor?')) {
        editor.value = '';
        updatePreview();
        localStorage.removeItem('kindleMarkdown');
        saveStatus.textContent = 'New document';
        setTimeout(function() {
            saveStatus.textContent = 'Ready';
        }, 2000);
    }
    closeAllMenus();
}

// Toggle preview mode
function togglePreview() {
    isPreviewMode = !isPreviewMode;
    if (isPreviewMode) {
        editor.blur();
        editor.style.display = 'none';
        preview.style.display = 'block';
        preview.innerHTML = parseMarkdown(editor.value);
        previewBtn.textContent = 'Edit';
    } else {
        editor.style.display = 'block';
        preview.style.display = 'none';
        previewBtn.textContent = 'Preview';
        setTimeout(function() {
            editor.focus();
        }, 10);
    }
    closeAllMenus();
}

// Toggle Ctrl modifier
function toggleCtrl() {
    ctrlPressed = !ctrlPressed;
    ctrlBtn.classList.toggle('active');
    if (!ctrlPressed) {
        selectionAnchor = null;
    }
    editor.focus();
}

// Toggle Shift modifier
function toggleShift() {
    shiftPressed = !shiftPressed;
    shiftBtn.classList.toggle('active');
    if (!shiftPressed) {
        selectionAnchor = null;
    }
    editor.focus();
}

// Send arrow key with modifiers
function sendArrow(arrow) {
    editor.focus();
    
    var text = editor.value;
    var start = editor.selectionStart;
    var end = editor.selectionEnd;
    
    // For shift selection, track anchor point
    if (shiftPressed && selectionAnchor === null) {
        selectionAnchor = start;
    }
    
    // Current cursor position (the moving end of selection)
    var pos = (selectionAnchor !== null) ? end : start;
    if (shiftPressed && end === start) {
        pos = start;
    }
    
    var lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    var lineEnd = text.indexOf('\n', pos);
    if (lineEnd === -1) lineEnd = text.length;
    
    var newPos = pos;
    
    switch(arrow) {
        case 'ArrowUp':
            if (ctrlPressed) {
                // Ctrl+Up: Move to start
                newPos = 0;
            } else {
                // Move up one line
                var prevLineEnd = lineStart - 1;
                if (prevLineEnd >= 0) {
                    var prevLineStart = text.lastIndexOf('\n', prevLineEnd - 1) + 1;
                    var colOffset = pos - lineStart;
                    var prevLineLength = prevLineEnd - prevLineStart;
                    newPos = prevLineStart + Math.min(colOffset, prevLineLength);
                } else {
                    newPos = 0;
                }
            }
            break;
        case 'ArrowDown':
            if (ctrlPressed) {
                // Ctrl+Down: Move to end
                newPos = text.length;
            } else {
                // Move down one line
                var nextLineStart = lineEnd + 1;
                if (nextLineStart <= text.length) {
                    var nextLineEnd = text.indexOf('\n', nextLineStart);
                    if (nextLineEnd === -1) nextLineEnd = text.length;
                    var colOffset = pos - lineStart;
                    var nextLineLength = nextLineEnd - nextLineStart;
                    newPos = nextLineStart + Math.min(colOffset, nextLineLength);
                } else {
                    newPos = text.length;
                }
            }
            break;
        case 'ArrowLeft':
            if (ctrlPressed) {
                // Ctrl+Left: Move to start of previous word
                newPos = pos - 1;
                while (newPos > 0 && /\s/.test(text[newPos])) newPos--;
                while (newPos > 0 && !/\s/.test(text[newPos - 1])) newPos--;
            } else {
                // Move left one character
                newPos = Math.max(0, pos - 1);
            }
            break;
        case 'ArrowRight':
            if (ctrlPressed) {
                // Ctrl+Right: Move to end of next word
                newPos = pos;
                while (newPos < text.length && !/\s/.test(text[newPos])) newPos++;
                while (newPos < text.length && /\s/.test(text[newPos])) newPos++;
            } else {
                // Move right one character
                newPos = Math.min(text.length, pos + 1);
            }
            break;
    }
    
    // Apply selection or move cursor
    if (shiftPressed) {
        // Extend selection from anchor to new position
        var anchor = selectionAnchor !== null ? selectionAnchor : start;
        if (newPos < anchor) {
            editor.setSelectionRange(newPos, anchor);
        } else {
            editor.setSelectionRange(anchor, newPos);
        }
        // Keep anchor for next shift+arrow
        selectionAnchor = anchor;
    } else {
        // Just move cursor
        editor.setSelectionRange(newPos, newPos);
        selectionAnchor = null;
    }
    
    // Reset modifiers after use
    ctrlPressed = false;
    shiftPressed = false;
    ctrlBtn.classList.remove('active');
    shiftBtn.classList.remove('active');
}

// Menu functionality
function toggleMenu(button) {
    var parent = button.parentElement;
    var wasOpen = parent.classList.contains('open');
    var menuBar = document.querySelector('.menu-bar');
    var content = document.querySelector('.content');
    
    closeAllMenus();
    
    if (!wasOpen) {
        parent.classList.add('open');
        menuBar.classList.add('expanded');
        // Push content down when dropdown opens
        content.style.top = '230px';
    }
    
    // Keep focus in editor to prevent keyboard from closing
    setTimeout(function() {
        editor.focus();
    }, 0);
    return false;
}

function closeAllMenus() {
    var items = document.querySelectorAll('.menu-item');
    items.forEach(function(item) {
        item.classList.remove('open');
    });
    var menuBar = document.querySelector('.menu-bar');
    var content = document.querySelector('.content');
    if (menuBar) {
        menuBar.classList.remove('expanded');
    }
    if (content) {
        content.style.top = '86px';
    }
}

// Close menus when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.menu-item')) {
        closeAllMenus();
    }
});

// Keyboard shortcuts - supports both real and virtual modifiers
editor.addEventListener('keydown', function(e) {
    var useCtrl = e.ctrlKey || e.metaKey || ctrlPressed;
    var useShift = e.shiftKey || shiftPressed;
    
    // Handle Enter key - auto-indent and continue lists
    // Use keyCode 13 for better Kindle compatibility
    if ((e.key === 'Enter' || e.keyCode === 13) && !useCtrl && !useShift) {
        var start = editor.selectionStart;
        var end = editor.selectionEnd;
        var text = editor.value;
        
        // Find the current line (from last newline to cursor)
        var lineStart = text.lastIndexOf('\n', start - 1) + 1;
        var currentLine = text.substring(lineStart, start);
        
        // Patterns to check
        var prefix = '';
        var shouldClear = false;
        
        // Check unordered list: "  - text" or "- text" or "  * text"
        var ulMatch = currentLine.match(/^(\s*[-*]\s)/);
        if (ulMatch) {
            var afterBullet = currentLine.substring(ulMatch[1].length);
            if (afterBullet.length === 0) {
                // Empty bullet - clear the line
                shouldClear = true;
            } else {
                prefix = ulMatch[1];
            }
        }
        
        // Check ordered list: "  1. text" or "1. text"
        if (!ulMatch) {
            var olMatch = currentLine.match(/^(\s*)(\d+)(\.\s)/);
            if (olMatch) {
                var afterNum = currentLine.substring(olMatch[0].length);
                if (afterNum.length === 0) {
                    // Empty numbered item - clear the line
                    shouldClear = true;
                } else {
                    var nextNum = parseInt(olMatch[2], 10) + 1;
                    prefix = olMatch[1] + nextNum + olMatch[3];
                }
            }
        }
        
        // Check plain indentation (spaces/tabs at start)
        if (!ulMatch && !prefix && !shouldClear) {
            var indentMatch = currentLine.match(/^(\s+)/);
            if (indentMatch) {
                prefix = indentMatch[1];
            }
        }
        
        // Apply the transformation
        if (shouldClear) {
            e.preventDefault();
            // Remove the empty list item line, insert just newline
            var before = text.substring(0, lineStart);
            var after = text.substring(end);
            editor.value = before + '\n' + after;
            editor.setSelectionRange(lineStart + 1, lineStart + 1);
            updateStats();
            scheduleSave();
            return false;
        } else if (prefix) {
            e.preventDefault();
            // Insert newline + prefix
            var before = text.substring(0, start);
            var after = text.substring(end);
            var insert = '\n' + prefix;
            editor.value = before + insert + after;
            var newPos = start + insert.length;
            editor.setSelectionRange(newPos, newPos);
            updateStats();
            scheduleSave();
            return false;
        }
    }
    
    // Handle Ctrl+key combinations
    if (useCtrl) {
        switch(e.key.toLowerCase()) {
            case 'a':
                e.preventDefault();
                editor.setSelectionRange(0, editor.value.length);
                resetModifiers();
                return;
            case 'b':
                e.preventDefault();
                insertMarkdown('**', '**');
                resetModifiers();
                return;
            case 'i':
                e.preventDefault();
                insertMarkdown('*', '*');
                resetModifiers();
                return;
            case 's':
                e.preventDefault();
                saveToFile();
                resetModifiers();
                return;
            case 'o':
                e.preventDefault();
                document.getElementById('fileInput').click();
                resetModifiers();
                return;
            case 'c':
                // Allow native copy
                resetModifiers();
                return;
            case 'v':
                // Allow native paste
                resetModifiers();
                return;
            case 'x':
                // Allow native cut
                resetModifiers();
                return;
            case 'z':
                // Allow native undo
                resetModifiers();
                return;
        }
    }
    
    // Handle arrow keys with virtual shift
    if (useShift && !e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        // Temporarily set shiftPressed for sendArrow
        shiftPressed = true;
        sendArrow(e.key);
        return;
    }
    
    // Reset selection anchor on non-shift navigation
    if (!useShift && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        selectionAnchor = null;
    }
});

// Reset virtual modifiers
function resetModifiers() {
    ctrlPressed = false;
    shiftPressed = false;
    ctrlBtn.classList.remove('active');
    shiftBtn.classList.remove('active');
    selectionAnchor = null;
}

// Listen for changes
editor.addEventListener('input', updatePreview);

// Reset selection anchor on click
editor.addEventListener('click', function() {
    selectionAnchor = null;
});

// Initialize
loadFromStorage();
updatePreview();
