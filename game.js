(function () {
  'use strict';

  var COLS = 7, ROWS = 8, COLORS = 5;
  var grid = [], score = 0, best = 0, busy = false, gen = 0;
  var boardEl = document.getElementById('board');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var msgEl = document.getElementById('msg');

  function loadBest() {
    try { best = parseInt(localStorage.getItem('bb_best'), 10) || 0; }
    catch (e) { best = 0; }
  }
  function saveBest() {
    try { localStorage.setItem('bb_best', String(best)); } catch (e) {}
  }

  function rnd() { return Math.floor(Math.random() * COLORS); }
  function say(text) { msgEl.textContent = text; }
  function cellEl(r, c) { return boardEl.children[r * COLS + c]; }

  function newBoard() {
    gen++;
    grid = [];
    for (var r = 0; r < ROWS; r++) {
      var row = [];
      for (var c = 0; c < COLS; c++) row.push({ k: rnd(), d: r + 1 });
      grid.push(row);
    }
    score = 0;
    busy = true;
    render();
    say('Tap a group of 3 or more');
    setTimeout(function () { busy = false; }, 400);
  }

  function render() {
    boardEl.innerHTML = '';
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = grid[r][c];
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bubble k' + cell.k + (cell.d ? ' drop' : '');
        b.style.setProperty('--d', cell.d);
        b.setAttribute('aria-label', 'bubble');
        b.dataset.r = r;
        b.dataset.c = c;
        boardEl.appendChild(b);
        cell.d = 0;
      }
    }
    scoreEl.textContent = score;
    bestEl.textContent = best;
  }

  // Connected same-colour bubbles (up, down, left, right only)
  function findGroup(r, c) {
    var k = grid[r][c].k, seen = {}, stack = [[r, c]], out = [];
    seen[r + ',' + c] = true;
    while (stack.length) {
      var p = stack.pop();
      out.push(p);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var nr = p[0] + d[0], nc = p[1] + d[1], key = nr + ',' + nc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
            !seen[key] && grid[nr][nc].k === k) {
          seen[key] = true;
          stack.push([nr, nc]);
        }
      });
    }
    return out;
  }

  function popGroup(group) {
    var n = group.length;
    var pts = n * 10 + (n - 3) * (n - 3) * 5;   // bonus grows with group size
    score += pts;
    if (score > best) { best = score; saveBest(); }

    group.forEach(function (p) { grid[p[0]][p[1]] = null; });

    // Gravity + refill, one column at a time
    for (var c = 0; c < COLS; c++) {
      var keep = [];
      for (var r = ROWS - 1; r >= 0; r--) {
        if (grid[r][c]) keep.push({ cell: grid[r][c], old: r });
      }
      for (var i = 0; i < ROWS; i++) {
        var nr = ROWS - 1 - i;
        if (i < keep.length) {
          keep[i].cell.d = nr - keep[i].old;
          grid[nr][c] = keep[i].cell;
        } else {
          grid[nr][c] = { k: rnd(), d: nr + 1 };
        }
      }
    }

    render();
    say('+' + pts + (n >= 6 ? '  Lovely!' : ''));
    setTimeout(function () { busy = false; }, 380);
  }

  boardEl.addEventListener('click', function (e) {
    var b = e.target.closest('.bubble');
    if (!b || busy) return;                      // ignore taps mid-animation
    var group = findGroup(+b.dataset.r, +b.dataset.c);

    if (group.length < 3) {                      // too small: gentle wiggle
      group.forEach(function (p) {
        var el = cellEl(p[0], p[1]);
        el.classList.remove('drop');
        el.classList.add('shake');
      });
      setTimeout(function () {
        group.forEach(function (p) {
          var el = cellEl(p[0], p[1]);
          if (el) el.classList.remove('shake');
        });
      }, 400);
      say('Need 3 or more matching bubbles');
      return;
    }

    busy = true;
    var myGen = gen;
    group.forEach(function (p) { cellEl(p[0], p[1]).classList.add('pop'); });
    setTimeout(function () { if (myGen === gen) popGroup(group); }, 260);
  });

  document.getElementById('again').addEventListener('click', newBoard);

  loadBest();
  newBoard();
})();
