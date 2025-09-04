// Pong in TypeScript (da compilare in JS e usare in una pagina HTML)
// Usa <canvas id="gameCanvas" width="800" height="600"></canvas> nell'HTML
var canvas = document.getElementById('gameCanvas');
if (!canvas) {
    alert('Canvas non trovato!');
    throw new Error('Canvas non trovato!');
}
canvas.width = 800;
canvas.height = 600;
var ctx = canvas.getContext('2d');
// Paddle
var Paddle = /** @class */ (function () {
    function Paddle(x, y) {
        this.width = 20;
        this.height = 100;
        this.speed = 15;
        this.x = x;
        this.y = y;
    }
    Paddle.prototype.move = function (dy) {
        this.y += dy;
        // Limiti bordo
        if (this.y < 0)
            this.y = 0;
        if (this.y + this.height > canvas.height)
            this.y = canvas.height - this.height;
    };
    Paddle.prototype.draw = function (ctx) {
        ctx.fillRect(this.x, this.y, this.width, this.height);
    };
    return Paddle;
}());
// Ball
var Ball = /** @class */ (function () {
    function Ball(x, y) {
        this.radius = 10;
        this.dx = 5;
        this.dy = 5;
        this.x = x;
        this.y = y;
    }
    Ball.prototype.move = function () {
        this.x += this.dx;
        this.y += this.dy;
    };
    Ball.prototype.draw = function (ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    };
    return Ball;
}());
// Game state
// Molto vicini ai bordi (originale)
var leftPaddle = new Paddle(20, canvas.height / 2 - 50);
var rightPaddle = new Paddle(canvas.width - 40, canvas.height / 2 - 50);
var ball = new Ball(canvas.width / 2, canvas.height / 2);
var leftScore = 0;
var rightScore = 0;
var speedPongs = 0;
// Input
var upPressed = false;
var downPressed = false;
var wPressed = false;
var sPressed = false;
document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp')
        upPressed = true;
    if (e.key === 'ArrowDown')
        downPressed = true;
    if (e.key === 'w')
        wPressed = true;
    if (e.key === 's')
        sPressed = true;
});
document.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowUp')
        upPressed = false;
    if (e.key === 'ArrowDown')
        downPressed = false;
    if (e.key === 'w')
        wPressed = false;
    if (e.key === 's')
        sPressed = false;
});
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 5 : -5);
    ball.dy = (Math.random() > 0.5 ? 5 : -5);
}
function drawScore() {
    ctx.fillStyle = "#fff"; // Colore bianco per il testo
    ctx.font = '40px Arial';
    ctx.fillText("".concat(leftScore), canvas.width / 4, 50);
    ctx.fillText("".concat(rightScore), 3 * canvas.width / 4, 50);
}
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Muovi paddle
    if (wPressed)
        leftPaddle.move(-leftPaddle.speed);
    if (sPressed)
        leftPaddle.move(leftPaddle.speed);
    if (upPressed)
        rightPaddle.move(-rightPaddle.speed);
    if (downPressed)
        rightPaddle.move(rightPaddle.speed);
    // Muovi palla
    ball.move();
    // Collisione con bordo
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy *= -1;
    }
    // Collisione con paddle sinistro
    if (ball.dx < 0 && // la palla si muove verso sinistra
        ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
        ball.x - ball.radius > leftPaddle.x && // la palla non ha già superato il bordo
        ball.y > leftPaddle.y &&
        ball.y < leftPaddle.y + leftPaddle.height) {
        if (ball.y - leftPaddle.y > 45 && ball.y - leftPaddle.y < 55) {
            ball.dy = 0;
            ball.dx = 10;
        }
        else
            ball.dy *= 1.2;
        ball.dx *= -1;
        ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
    }
    // Collisione con paddle destro
    if (ball.dx > 0 && // la palla si muove verso destra
        ball.x + ball.radius > rightPaddle.x &&
        ball.x + ball.radius < rightPaddle.x + rightPaddle.width && // la palla non ha già superato il bordo
        ball.y > rightPaddle.y &&
        ball.y < rightPaddle.y + rightPaddle.height) {
        ball.dx *= -1;
        ball.x = rightPaddle.x - ball.radius;
    }
    // Punto per destra
    if (ball.x - ball.radius < 0) {
        printBallGoalY();
        rightScore++;
        resetBall();
    }
    // Punto per sinistra
    if (ball.x + ball.radius > canvas.width) {
        printBallGoalY();
        leftScore++;
        resetBall();
    }
    ctx.fillStyle = "#fff"; // Colore bianco per paddle e palla
    leftPaddle.draw(ctx);
    rightPaddle.draw(ctx);
    ball.draw(ctx);
    drawScore();
    requestAnimationFrame(gameLoop);
}
function printBallImpactY(y) {
    console.log('-------------------------------------------------Preview y =', y);
}
function printBallGoalY() {
    if (ball.x + ball.radius > canvas.width) {
        console.log('La palla ha segnato sulla destra a y =', ball.y);
    }
}
function enemy() {
    // Esegui ogni 1000 ms
    setInterval(function () {
        // Calcola solo se la palla va verso destra
        if (ball.dx > 0) {
            // Calcola dove la palla colpirà il muro destro
            // Formula retta: y = m*x + q
            // m = ball.dy / ball.dx
            // q = ball.y - m * ball.x
            var m = ball.dy / ball.dx;
            var q = 0;
            var x_wall = 0;
            var y_wall = 0;
            if (ball.dy == 0)
                y_wall = ball.y;
            else if (ball.dy > 0) {
                y_wall = 600;
                q = ball.y - m * ball.x;
                x_wall = (y_wall - q) / m;
                if (x_wall < 800) {
                    q = y_wall - (-m) * x_wall;
                    x_wall = 800;
                    y_wall = -m * x_wall + q;
                }
                else {
                    y_wall = m * 800 + q;
                }
            }
            else {
                y_wall = 0;
                q = ball.y - m * ball.x;
                x_wall = (y_wall - q) / m;
                if (x_wall < 800) {
                    q = y_wall - (-m) * x_wall;
                    x_wall = 800;
                    y_wall = -m * x_wall + q;
                }
                else {
                    y_wall = m * 800 + q;
                }
            }
            // x muro destro
            // y di impatto con il muros
            var future_y_1 = Math.max(rightPaddle.height / 2, Math.min(y_wall, canvas.height - rightPaddle.height / 2));
            printBallImpactY(future_y_1); // Stampa la coordinata y_wall a terminale
            // Muovi paddle finché non raggiunge future_y
            var stopThreshold_1 = 8; // soglia fissa
            var moveInterval_1 = setInterval(function () {
                var paddleCenterY = rightPaddle.y + rightPaddle.height / 2;
                if (Math.abs(paddleCenterY - future_y_1) > stopThreshold_1) {
                    if (future_y_1 < paddleCenterY) {
                        upPressed = true;
                        downPressed = false;
                    }
                    else if (future_y_1 > paddleCenterY) {
                        downPressed = true;
                        upPressed = false;
                    }
                }
                else {
                    upPressed = false;
                    downPressed = false;
                    clearInterval(moveInterval_1);
                }
            }, 1); // 1 ms per step
        }
    }, 1000);
}
resetBall();
enemy();
gameLoop();
