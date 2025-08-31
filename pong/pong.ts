// Pong in TypeScript (da compilare in JS e usare in una pagina HTML)
// Usa <canvas id="gameCanvas" width="800" height="600"></canvas> nell'HTML

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
if (!canvas) {
    alert('Canvas non trovato!');
    throw new Error('Canvas non trovato!');
}
canvas.width = 800;
canvas.height = 600;
const ctx = canvas.getContext('2d')!;

// Paddle
class Paddle {
    public x: number;
    public y: number;
    public width: number = 20;
    public height: number = 100;
    public speed: number = 6;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    move(dy: number) {
        this.y += dy;
        // Limiti bordo
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// Ball
class Ball {
    public x: number;
    public y: number;
    public radius: number = 10;
    public dx: number = 5;
    public dy: number = 5;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game state
const leftPaddle = new Paddle(30, canvas.height / 2 - 50);
const rightPaddle = new Paddle(canvas.width - 50, canvas.height / 2 - 50);
const ball = new Ball(canvas.width / 2, canvas.height / 2);
let leftScore = 0;
let rightScore = 0;

// Input
let upPressed = false;
let downPressed = false;
let wPressed = false;
let sPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') upPressed = true;
    if (e.key === 'ArrowDown') downPressed = true;
    if (e.key === 'w') wPressed = true;
    if (e.key === 's') sPressed = true;
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') upPressed = false;
    if (e.key === 'ArrowDown') downPressed = false;
    if (e.key === 'w') wPressed = false;
    if (e.key === 's') sPressed = false;
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
    ctx.fillText(`${leftScore}`, canvas.width / 4, 50);
    ctx.fillText(`${rightScore}`, 3 * canvas.width / 4, 50);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Muovi paddle
    if (wPressed) leftPaddle.move(-leftPaddle.speed);
    if (sPressed) leftPaddle.move(leftPaddle.speed);
    if (upPressed) rightPaddle.move(-rightPaddle.speed);
    if (downPressed) rightPaddle.move(rightPaddle.speed);

    // Muovi palla
    ball.move();

    // Collisione con bordo
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy *= -1;
    }

    // Collisione con paddle sinistro
    if (
        ball.dx < 0 && // la palla si muove verso sinistra
        ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
        ball.x - ball.radius > leftPaddle.x && // la palla non ha già superato il bordo
        ball.y > leftPaddle.y &&
        ball.y < leftPaddle.y + leftPaddle.height
    ) {
        ball.dx *= -1;
        ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
    }

    // Collisione con paddle destro
    if (
        ball.dx > 0 && // la palla si muove verso destra
        ball.x + ball.radius > rightPaddle.x &&
        ball.x + ball.radius < rightPaddle.x + rightPaddle.width && // la palla non ha già superato il bordo
        ball.y > rightPaddle.y &&
        ball.y < rightPaddle.y + rightPaddle.height
    ) {
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

function printBallImpactY(y: number) {
    console.log('-------------------------------------------------Preview y =', y);
}

function printBallGoalY() {
    if (ball.x + ball.radius > canvas.width) {
        console.log('La palla ha segnato sulla destra a y =', ball.y);
    }
}

function enemy() {
    // Esegui ogni 1000 ms
    setInterval(() => 
		{
        // Calcola solo se la palla va verso destra
        if (ball.dx > 0) 
		{
            // Calcola dove la palla colpirà il muro destro
            // Formula retta: y = m*x + q
            // m = ball.dy / ball.dx
            // q = ball.y - m * ball.x
			let m = ball.dy / ball.dx;
			let q = 0;
			let x_wall = 0;
			let y_wall = 0;
			if (ball.dy > 0)
			{
				y_wall = 600
				q = ball.y - m * ball.x
				x_wall = (y_wall - q)/ m ;
				if (x_wall < 800)
				{
					q = y_wall - (-m) * x_wall;
					x_wall = 800;
					y_wall = -m * x_wall + q;
				}
				else 
				{
					
					y_wall = m * 800 + q;
				}
			}
			else
			{
				y_wall = 0
				q = ball.y - m * ball.x
				x_wall = (y_wall - q)/ m ;
				if (x_wall < 800)
				{
					q = y_wall -(-m) * x_wall;
					x_wall = 800;
					y_wall = -m * x_wall + q;
				}
				else 
				{
					y_wall = m * 800 + q;
				}
			}
            // x muro destro

			// y di impatto con il muros
            let future_y = Math.max(rightPaddle.height / 2, Math.min(y_wall, canvas.height - rightPaddle.height / 2));
            printBallImpactY(future_y); // Stampa la coordinata y_wall a terminale
            // Muovi paddle finché non raggiunge future_y
            const stopThreshold = 8; // soglia fissa
            const moveInterval = setInterval(() => {
                const paddleCenterY = rightPaddle.y + rightPaddle.height / 2;
                if (Math.abs(paddleCenterY - future_y) > stopThreshold) {
                    if (future_y < paddleCenterY) {
                        upPressed = true;
                        downPressed = false;
                    } else if (future_y > paddleCenterY) {
                        downPressed = true;
                        upPressed = false;
                    }
                } else {
                    upPressed = false;
                    downPressed = false;
                    clearInterval(moveInterval);
                }
            }, 1); // 1 ms per step
        }
    }, 1000);
}

resetBall();
enemy();
gameLoop();
