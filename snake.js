var generation = 0;

function generateCanvas (canvasEls) {
  generation++;
  var thisGeneration = generation;

  var canvasBackground = canvasEls[0];
  var canvasGame = canvasEls[1];

  var bgctx = canvasBackground.getContext('2d');
  var ctx = canvasGame.getContext('2d');

  var width = canvasBackground.width = canvasGame.width = canvasGame.parentNode.offsetWidth;
  var height = canvasBackground.height = canvasGame.height = canvasGame.parentNode.offsetHeight;

  canvasBackground.style.width = width + 'px';
  canvasBackground.style.height = height + 'px';
  canvasGame.style.width = width + 'px';
  canvasGame.style.height = height + 'px';

  var snake, vx, vy, apple, sx, sy, w, h, p, changedDirection, died, ateApple, score, scoreSquares, paused;

  var squareDensity = width < 800 ? 0.0004 : 0.0003;

  let boundFrameRequest = requestAnimationFrame.bind(this, frame);

  function approxRatio (width, height) {
    var minDiff, min = [1, 1], widthBigger = true;

    if (width === height) {
      return [1, 1];
    } else if (width < height) {
      widthBigger = false;
      var tmp = height;
      height = width;
      width = tmp;
    }

    minDiff = width - height;

    for (var i = 2; i < 9; i++) {
      for (var j = 1; j < i; j++) {
        var diff = Math.abs((width / i) - (height / j));

        if (diff + 1 < minDiff) {
          minDiff = diff;
          min = [i, j];
        }
      }
    }

    return widthBigger ? min : [min[1], min[0]];
  }

  function gridSize (approxSquares, approxRatio) {
    var product = approxRatio[0] * approxRatio[1];

    var squaresPerBlock = approxSquares / product;

    var blockLength = Math.floor(Math.sqrt(squaresPerBlock - 1)) + 1;

    return [approxRatio[0] * blockLength, approxRatio[1] * blockLength];
  }

  function numberToSquares (x) {
    var digits = (Math.floor(x) + '').split('').map(x => parseInt(x));
    var currLeft = 1;
    var currTop = 1;
    var squares = [];

    for (var i = 0; i < digits.length; i++) {
      var digit = digits[i];

      var digitSquares;

      switch (digit) {
        case 0:
          digitSquares = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [1, 4], [0, 4], [0, 3], [0, 2], [0, 1]]; break;
        case 1:
          digitSquares = [[0, 0], [0, 4], [0, 3], [0, 2], [0, 1]]; break;
        case 2:
          digitSquares = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [0, 3], [2, 4], [1, 4], [0, 4], [0, 2], [1, 2]]; break;
        case 3:
          digitSquares = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [1, 4], [0, 4], [0, 2], [1, 2]]; break;
        case 4:
          digitSquares = [[0, 0], [1, 2], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [0, 2], [0, 1]]; break;
        case 5:
          digitSquares = [[0, 0], [1, 0], [2, 0], [1, 2], [2, 2], [2, 3], [2, 4], [1, 4], [0, 4], [0, 2], [0, 1]]; break;
        case 6:
          digitSquares = [[0, 0], [1, 2], [2, 2], [2, 3], [2, 4], [1, 4], [0, 4], [0, 3], [0, 2], [0, 1]]; break;
        case 7:
          digitSquares = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4]]; break;
        case 8:
          digitSquares = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [1, 4], [0, 4], [0, 3], [0, 2], [0, 1], [1, 2]]; break;
        case 9:
          digitSquares = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [1, 2], [0, 2], [0, 1]];
      }

      digitSquares.forEach(x => squares.push([x[0] + currLeft, x[1] + currTop]));

      currLeft += digit === 1 ? 2 : 4;
    }

    return squares;
  }

  function reset () {
    let sxsy = gridSize(squareDensity * width * height, approxRatio(width, height));

    sx = sxsy[0];
    sy = sxsy[1];

    snake = [[0,0], [1,0], [2,0], [3,0], [4,0]];
    vx = 1;
    vy = 0;
    p = 4;
    changedDirection = false;
    apple = [-1, -1];
    ateApple = false;
    died = false;
    score = 0;
    scoreSquares = numberToSquares(score);

    moveApple();
  }

  function moveApple () {
    do {
      apple[0] = Math.floor(Math.random()*sx);
      apple[1] = Math.floor(Math.random()*sy);
    } while (
      snake.filter(sq => sq[0] === apple[0] && sq[1] === apple[1]).length
    )
  }

  function game () {
    var last = snake[snake.length-1];
    var nextX = last[0] + vx;
    var nextY = last[1] + vy;

    if (nextX < 0)   nextX = sx - 1;
    if (nextX >= sx) nextX = 0;

    if (nextY < 0)   nextY = sy - 1;
    if (nextY >= sy) nextY = 0;

    if (snake.filter(sq => sq[0] === nextX && sq[1] === nextY).length) {
      score = 0;
      scoreSquares = numberToSquares(score);
      snake = snake.slice(Math.max(0, snake.length - 4));
      snake.push([nextX, nextY]);
      ateApple = false;
      died = true;
    } else {
      snake.push([nextX, nextY]);
      if (nextX === apple[0] && nextY === apple[1]) {
        score++;
        scoreSquares = numberToSquares(score);
        moveApple();
        ateApple = true;
      } else {
        snake = snake.slice(1);
        ateApple = false;
      }
      died = false;
    }

    changedDirection = false;
  }

  function frame () {
    game();

    bgctx.clearRect(0, 0, width, height);
    ctx.clearRect(0, 0, width, height);

    // Score

    ctx.fillStyle = '#333';

    for (var i = 0; i < scoreSquares.length; i++) {
      var x = (scoreSquares[i][0] * (width / sx)) + (2 * p) - (scoreSquares[i][0] * ((2 * p) / sx));
      var y = (scoreSquares[i][1] * (height / sy)) + (2 * p) - (scoreSquares[i][1] * ((2 * p) / sy));
      var w = (width / sx) - (2 * p) - ((2 * p) / sx);
      var h = (height / sy) - (2 * p) - ((2 * p) / sy);

      ctx.fillRect(x, y, w, h);
    }

    // Apple

    ctx.fillStyle = '#0f0';

    var x = (apple[0] * (width / sx)) + (2 * p) - (apple[0] * ((2 * p) / sx));
    var y = (apple[1] * (height / sy)) + (2 * p) - (apple[1] * ((2 * p) / sy));
    var w = (width / sx) - (2 * p) - ((2 * p) / sx);
    var h = (height / sy) - (2 * p) - ((2 * p) / sy);

    ctx.fillRect(x, y, w, h);

    // Snake
    for (var i = 0; i < snake.length; i++) {

      if (ateApple && i === snake.length - 1) {
        ctx.fillStyle = '#9f9';
      } else if (died) {
        ctx.fillStyle = '#f99';
      } else {
        var gray = Math.floor(128 + (127 * i / (snake.length - 1))).toString(16);
        ctx.fillStyle = '#' + gray + gray + gray;
      }

      var x = (snake[i][0] * (width / sx)) + (2 * p) - (snake[i][0] * ((2 * p) / sx));
      var y = (snake[i][1] * (height / sy)) + (2 * p) - (snake[i][1] * ((2 * p) / sy));
      var w = (width / sx) - (2 * p) - ((2 * p) / sx);
      var h = (height / sy) - (2 * p) - ((2 * p) / sy);

      ctx.fillRect(x, y, w, h);
    }

    // Background
    for (var i = 0; i < sx; i++) {
      for (var j = 0; j < sy; j++) {
        var gray = Math.floor(7 + Math.floor(14 * Math.random()));
        bgctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';

        var x = (i * (width / sx)) + (2 * p) - (i * ((2 * p) / sx));
        var y = (j * (height / sy)) + (2 * p) - (j * ((2 * p) / sy));
        var w = (width / sx) - (2 * p) - ((2 * p) / sx);
        var h = (height / sy) - (2 * p) - ((2 * p) / sy);

        bgctx.fillRect(x, y, w, h);
      }
    }

    if (generation === thisGeneration && !paused)
      setTimeout(boundFrameRequest, 100);
  }

  document.body.addEventListener('keydown', function (e) {
    if ([32, 37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();

    if (changedDirection) return;

    if (e.keyCode === 37) {
      if (vx > 0) return;
      vx = -1;
      vy = 0;
    } else if (e.keyCode === 38) {
      if (vy > 0) return;
      vx = 0;
      vy = -1;
    } else if (e.keyCode === 39) {
      if (vx < 0) return;
      vx = 1;
      vy = 0;
    } else if (e.keyCode === 40) {
      if (vy < 0) return;
      vx = 0;
      vy = 1;
    } else if (e.keyCode === 32) {
      paused = !paused;
      changedDirection = false;
      if (!paused) boundFrameRequest();
      return;
    } else {
      changedDirection = false;
      return;
    }

    changedDirection = true;
  });

  reset();
  frame();
}
