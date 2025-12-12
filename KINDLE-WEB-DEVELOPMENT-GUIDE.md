# Kindle Web Development Guide

A comprehensive guide for developing web applications compatible with Amazon Kindle's experimental browser, based on real-world testing and development experience.

## Table of Contents
1. [Browser Overview](#browser-overview)
2. [CSS Guidelines](#css-guidelines)
3. [JavaScript Guidelines](#javascript-guidelines)
4. [Layout Strategies](#layout-strategies)
5. [Input Handling](#input-handling)
6. [Common Pitfalls](#common-pitfalls)
7. [Testing Approach](#testing-approach)
8. [Quick Reference](#quick-reference)

---

## Browser Overview

### What is the Kindle Browser?
The Kindle's "Experimental Browser" uses **NetFront**, based on an older version of WebKit. It has significant limitations compared to modern browsers.

### Key Characteristics
- **Engine**: NetFront (old WebKit-based)
- **JavaScript**: ES5 only (no ES6+ features)
- **CSS**: Limited CSS3 support
- **Display**: E-ink with slow refresh rates
- **Input**: Touch screen with on-screen keyboard

---

## CSS Guidelines

### ✅ What Works

#### Positioning
```css
/* Absolute positioning is the most reliable layout method */
.container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40px;
}

.content {
    position: absolute;
    top: 40px;
    left: 0;
    right: 0;
    bottom: 50px;
}

.footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50px;
}
```

#### Display Properties
```css
/* Use inline-block for horizontal layouts */
.menu-item {
    display: inline-block;
    vertical-align: top;
}

/* Block for vertical stacking */
.row {
    display: block;
}
```

#### Basic Styling
```css
/* These work reliably */
background: #ffffff;
color: #000000;
border: 2px solid #000000;
padding: 10px;
margin: 5px;
font-size: 16px;
font-family: serif;
font-weight: bold;
text-align: center;
```

#### Height and Width
```css
/* Percentage heights work when parent has explicit height */
html { height: 100%; }
body { height: 100%; }

/* Pixel values are most reliable */
.button { width: 40px; height: 40px; }
```

### ❌ What Doesn't Work

#### Flexbox
```css
/* AVOID - Flexbox is poorly supported or broken */
display: flex;
flex-direction: row;
justify-content: center;
align-items: center;
flex: 1;
```

#### Grid
```css
/* AVOID - CSS Grid is not supported */
display: grid;
grid-template-columns: 1fr 1fr;
```

#### Modern CSS Units
```css
/* AVOID - These units are not supported */
height: 100svh;  /* Small viewport height */
height: 100dvh;  /* Dynamic viewport height */
height: 100lvh;  /* Large viewport height */
width: 50vw;     /* May have issues */
```

#### Complex calc()
```css
/* AVOID - calc() can be unreliable */
height: calc(100% - 50px);  /* May not work */
/* USE INSTEAD: absolute positioning with top/bottom */
```

#### CSS Variables
```css
/* AVOID - CSS custom properties not supported */
:root { --primary-color: #000; }
color: var(--primary-color);
```

#### Advanced Selectors
```css
/* AVOID - Sibling selectors may not work */
.menu.expanded ~ .content { top: 200px; }
/* USE INSTEAD: JavaScript to directly modify styles */
```

---

## JavaScript Guidelines

### ✅ What Works

#### ES5 Syntax Only
```javascript
// Use var, not let or const
var myVariable = 'hello';

// Use function declarations
function myFunction() {
    return 'hello';
}

// Use traditional for loops
for (var i = 0; i < items.length; i++) {
    console.log(items[i]);
}

// Use function expressions for callbacks
array.forEach(function(item) {
    console.log(item);
});
```

#### DOM Manipulation
```javascript
// These work reliably
document.getElementById('myId');
document.querySelector('.myClass');
document.querySelectorAll('.myClass');
element.innerHTML = '<p>Hello</p>';
element.textContent = 'Hello';
element.className = 'active';
element.classList.add('active');
element.classList.remove('active');
element.style.top = '50px';
```

#### Event Handling
```javascript
// addEventListener works
element.addEventListener('click', function(e) {
    e.preventDefault();
});

// Inline handlers work (useful for preventing keyboard close)
// <button onclick="myFunc()" onmousedown="return false;">
```

#### Textarea/Input Manipulation
```javascript
// Selection and cursor positioning works
textarea.selectionStart;
textarea.selectionEnd;
textarea.setSelectionRange(start, end);
textarea.value = 'new text';
textarea.focus();
```

### ❌ What Doesn't Work

#### ES6+ Features
```javascript
// AVOID - Arrow functions
const fn = () => {};

// AVOID - let and const
let x = 1;
const y = 2;

// AVOID - Template literals
`Hello ${name}`;

// AVOID - Destructuring
const { a, b } = obj;

// AVOID - Spread operator
const arr = [...other];

// AVOID - Classes
class MyClass {}

// AVOID - Promises (use callbacks instead)
fetch().then();

// AVOID - async/await
async function() { await something; }
```

#### Deprecated APIs (may not work)
```javascript
// AVOID - document.execCommand is deprecated and unreliable
document.execCommand('insertText', false, 'hello');
// USE INSTEAD: Direct value manipulation
var before = textarea.value.substring(0, start);
var after = textarea.value.substring(end);
textarea.value = before + 'hello' + after;
```

#### KeyboardEvent.key (partial support)
```javascript
// key may not work, use keyCode as fallback
editor.addEventListener('keydown', function(e) {
    // Check both for compatibility
    if (e.key === 'Enter' || e.keyCode === 13) {
        // Handle enter
    }
});
```

---

## Layout Strategies

### Full-Page App Layout

The most reliable approach for a full-page application:

```css
html {
    height: 100%;
    margin: 0;
    padding: 0;
}

body {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
}

.container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
}

.header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40px;
}

.toolbar {
    position: absolute;
    top: 40px;
    left: 0;
    right: 0;
    height: 48px;
}

.content {
    position: absolute;
    top: 88px;
    left: 0;
    right: 0;
    bottom: 30px;
    overflow-y: auto;
}

.status-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30px;
}
```

### Horizontal Button Row

```css
.button-row {
    white-space: nowrap;
}

.button {
    display: inline-block;
    vertical-align: top;
    /* or vertical-align: middle; */
}
```

### Dropdown Menus (Expanding Approach)

Z-index doesn't work reliably with some layouts. Instead, expand the parent container:

```css
.menu-bar {
    height: 48px;
}

.menu-bar.expanded {
    height: 230px;
}

.dropdown-menu {
    display: none;
    position: absolute;
    top: 40px; /* Below the button */
    left: 0;
}

.menu-item.open .dropdown-menu {
    display: block;
}
```

```javascript
function toggleMenu(button) {
    var menuBar = document.querySelector('.menu-bar');
    var content = document.querySelector('.content');
    var parent = button.parentElement;
    var wasOpen = parent.classList.contains('open');
    
    // Close all menus
    closeAllMenus();
    
    if (!wasOpen) {
        parent.classList.add('open');
        menuBar.classList.add('expanded');
        // Directly adjust content position
        content.style.top = '230px';
    }
}

function closeAllMenus() {
    var items = document.querySelectorAll('.menu-item');
    items.forEach(function(item) {
        item.classList.remove('open');
    });
    document.querySelector('.menu-bar').classList.remove('expanded');
    document.querySelector('.content').style.top = '88px';
}
```

---

## Input Handling

### Keeping the Keyboard Open

The Kindle keyboard closes when focus leaves the textarea. To keep it open:

```html
<!-- Use onmousedown="return false;" on all buttons -->
<button onclick="doSomething()" onmousedown="return false;">
    Click Me
</button>
```

```javascript
function doSomething() {
    // Do your action
    
    // Refocus the editor
    setTimeout(function() {
        editor.focus();
    }, 0);
}
```

### Virtual Modifier Keys (Ctrl/Shift)

Kindle doesn't have physical Ctrl/Shift keys. Implement virtual ones:

```javascript
var ctrlPressed = false;
var shiftPressed = false;

function toggleCtrl() {
    ctrlPressed = !ctrlPressed;
    document.getElementById('ctrlBtn').classList.toggle('active', ctrlPressed);
}

function toggleShift() {
    shiftPressed = !shiftPressed;
    document.getElementById('shiftBtn').classList.toggle('active', shiftPressed);
}

// Use in keyboard handler
editor.addEventListener('keydown', function(e) {
    var useCtrl = e.ctrlKey || ctrlPressed;
    var useShift = e.shiftKey || shiftPressed;
    
    if (useCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        editor.setSelectionRange(0, editor.value.length);
        resetModifiers();
    }
});

function resetModifiers() {
    ctrlPressed = false;
    shiftPressed = false;
    document.getElementById('ctrlBtn').classList.remove('active');
    document.getElementById('shiftBtn').classList.remove('active');
}
```

### Arrow Key Navigation

Implement custom arrow key buttons for text navigation:

```javascript
function sendArrow(direction) {
    var pos = editor.selectionStart;
    var text = editor.value;
    var newPos = pos;
    
    switch(direction) {
        case 'ArrowLeft':
            newPos = Math.max(0, pos - 1);
            break;
        case 'ArrowRight':
            newPos = Math.min(text.length, pos + 1);
            break;
        case 'ArrowUp':
            // Find previous line
            var lineStart = text.lastIndexOf('\n', pos - 1);
            if (lineStart >= 0) {
                var prevLineStart = text.lastIndexOf('\n', lineStart - 1) + 1;
                var colPos = pos - lineStart - 1;
                var prevLineLength = lineStart - prevLineStart;
                newPos = prevLineStart + Math.min(colPos, prevLineLength);
            }
            break;
        case 'ArrowDown':
            // Find next line
            var lineStart = text.lastIndexOf('\n', pos - 1) + 1;
            var nextLineStart = text.indexOf('\n', pos);
            if (nextLineStart >= 0) {
                var colPos = pos - lineStart;
                var nextNextLine = text.indexOf('\n', nextLineStart + 1);
                var nextLineLength = (nextNextLine >= 0 ? nextNextLine : text.length) - nextLineStart - 1;
                newPos = nextLineStart + 1 + Math.min(colPos, nextLineLength);
            }
            break;
    }
    
    editor.setSelectionRange(newPos, newPos);
    editor.focus();
}
```

### Text Insertion (Reliable Method)

Don't use `document.execCommand`. Manipulate the value directly:

```javascript
function insertText(before, after) {
    var start = editor.selectionStart;
    var end = editor.selectionEnd;
    var text = editor.value;
    var selected = text.substring(start, end);
    
    var newText = before + selected + after;
    editor.value = text.substring(0, start) + newText + text.substring(end);
    
    // Position cursor
    var newPos = start + before.length + selected.length;
    editor.setSelectionRange(newPos, newPos);
    editor.focus();
}
```

---

## Common Pitfalls

### 1. Textarea Not Filling Height

**Problem**: Textarea only takes up 25% of the page.

**Cause**: `height: 100%` doesn't work without proper parent chain, and `calc()` is unreliable.

**Solution**: Use absolute positioning:
```css
.content {
    position: absolute;
    top: 88px;
    left: 0;
    right: 0;
    bottom: 30px;
}

#editor {
    width: 100%;
    height: 100%;
}
```

### 2. Dropdown Menus Hidden Behind Content

**Problem**: Z-index doesn't work, dropdowns appear behind textarea.

**Cause**: `overflow` on parent creates stacking context issues.

**Solution**: Expand the menu container instead of overlaying:
```javascript
menuBar.classList.add('expanded');
content.style.top = '230px'; // Push content down
```

### 3. Keyboard Closes When Clicking Buttons

**Problem**: Every button click closes the on-screen keyboard.

**Solution**: Add `onmousedown="return false;"` to all buttons and refocus:
```html
<button onclick="action()" onmousedown="return false;">Button</button>
```

### 4. On-Screen Keyboard Covers Bottom Toolbar

**Problem**: Toolbar at bottom of screen is hidden by keyboard.

**Solution**: Place toolbar near the top of the screen, under the header.

### 5. Flexbox Layout Broken

**Problem**: Horizontal layout using flexbox doesn't work.

**Solution**: Use `inline-block`:
```css
.item {
    display: inline-block;
    vertical-align: top;
}
```

### 6. Enter Key Not Intercepted

**Problem**: Custom Enter key handling doesn't work.

**Cause**: `e.key` may not be supported.

**Solution**: Check both `e.key` and `e.keyCode`:
```javascript
if (e.key === 'Enter' || e.keyCode === 13) {
    e.preventDefault();
    // Handle enter
}
```

### 7. Icons/Emojis Not Displaying

**Problem**: Emoji icons don't render.

**Solution**: Use Unicode symbols that are widely supported:
```
✓ (checkmark)    ✎ (pencil)      ⬜ (white square)
⊞ (boxplus)      ↑ ↓ ← → (arrows)
```

---

## Testing Approach

### 1. Desktop First
Start development in a modern browser. Get the logic working.

### 2. Simplify Progressively
If something doesn't work on Kindle:
1. Check if it's a CSS issue (try simpler properties)
2. Check if it's a JS issue (try ES5 syntax)
3. Check if it's a layout issue (try absolute positioning)

### 3. Console Debugging
The Kindle browser has no dev tools. Add visible debug output:
```javascript
function debug(msg) {
    document.getElementById('status').textContent = msg;
}
```

### 4. Incremental Testing
Test each feature on Kindle as you build it. Don't build everything then test.

---

## Quick Reference

### CSS Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|----------|
| `position: absolute` | `display: flex` |
| `display: inline-block` | `display: grid` |
| `height: 100%` (with proper parent) | `height: 100svh` |
| `top: 0; bottom: 50px` | `height: calc(100% - 50px)` |
| `border: 2px solid #000` | CSS variables |
| Pixel values | Complex calc() |

### JavaScript Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|----------|
| `var x = 1` | `let x = 1` / `const x = 1` |
| `function fn() {}` | `const fn = () => {}` |
| `'string ' + variable` | `` `template ${literal}` `` |
| `for (var i = 0; ...)` | `for (let i of array)` |
| Direct value manipulation | `document.execCommand` |
| `e.keyCode` fallback | Only `e.key` |

### Recommended Structure

```
my-kindle-app/
├── index.html
├── styles.css
└── app.js
```

Keep it simple. Single HTML file with linked CSS and JS. No build process, no dependencies.

---

## Example: Minimal Kindle App Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Kindle App</title>
    <style>
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: serif;
            overflow: hidden;
        }
        .container {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
        }
        .header {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 40px;
            background: #000;
            color: #fff;
            text-align: center;
            line-height: 40px;
        }
        .content {
            position: absolute;
            top: 40px; left: 0; right: 0; bottom: 40px;
            padding: 10px;
            overflow-y: auto;
        }
        .footer {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 40px;
            background: #f0f0f0;
            border-top: 1px solid #000;
            text-align: center;
        }
        .btn {
            display: inline-block;
            padding: 8px 16px;
            margin: 4px;
            background: #fff;
            border: 2px solid #000;
            font-size: 14px;
            cursor: pointer;
        }
        .btn:active {
            background: #000;
            color: #fff;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">My Kindle App</div>
        <div class="content" id="content">
            <p>Hello, Kindle!</p>
        </div>
        <div class="footer">
            <button class="btn" onclick="doAction()" onmousedown="return false;">
                Action
            </button>
        </div>
    </div>
    <script>
        function doAction() {
            document.getElementById('content').innerHTML += '<p>Button clicked!</p>';
        }
    </script>
</body>
</html>
```

---

## Conclusion

Developing for Kindle requires a "back to basics" approach. Think of it as developing for a browser from 2010. When in doubt:

1. **Use simpler CSS** - If it doesn't work, try a more basic approach
2. **Use ES5 JavaScript** - Avoid all modern syntax
3. **Use absolute positioning** - It's the most reliable layout method
4. **Test incrementally** - Don't build everything before testing
5. **Keep it simple** - No frameworks, no build tools, just HTML/CSS/JS

The limitations force you to write lean, efficient code that works everywhere.
