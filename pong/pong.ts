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
    public speed: number = 15;

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
// Molto vicini ai bordi (originale)
const leftPaddle = new Paddle(20, canvas.height / 2 - 50);
const rightPaddle = new Paddle(canvas.width - 40, canvas.height / 2 - 50);
const ball = new Ball(canvas.width / 2, canvas.height / 2);
let leftScore = 0;
let rightScore = 0;
let speedPongs = 0;
let gameRunning = true;  
let winner: string | null = null;  
const WINNING_SCORE = 10; 
let enemyInterval: number | null = null; // ← NUOVO: per tracciare l'interval 
let moveIntervals: number[] = []; // ← NUOVO: per tracciare tutti i moveInterval 

function checkWinCondition(): boolean 
{
    if (leftScore >= WINNING_SCORE)
	{
        winner = "Player 1 (W/S)";
        gameRunning = false;
        return true;
    }
    if (rightScore >= WINNING_SCORE) 
	{
        winner = "Player 2 (↑/↓)";
        gameRunning = false;
        return true;
    }
    return false;
}

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
    // Riavvia il gioco con R quando è finito
    if ((e.key === 'r' || e.key === 'R') && !gameRunning) {
        restartGame();
    }
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

function restartGame() {
    // Ferma l'AI precedente se esiste
    if (enemyInterval) {
        window.clearInterval(enemyInterval);
        enemyInterval = null;
    }
    
    // Ferma tutti i moveInterval precedenti
    moveIntervals.forEach(interval => window.clearInterval(interval));
    moveIntervals = [];
    
    // Reset variabili di gioco
    leftScore = 0;
    rightScore = 0;
    gameRunning = true;
    winner = null;
    
    // Reset input (per sicurezza)
    upPressed = false;
    downPressed = false;
    wPressed = false;
    sPressed = false;
    
    // Reset posizioni
    leftPaddle.y = canvas.height / 2 - 50;
    rightPaddle.y = canvas.height / 2 - 50;
    
    resetBall();
    
    // Riavvia l'AI
    enemy();
    
    // NON chiamare requestAnimationFrame qui!
    // Il gameLoop sta già girando e continuerà automaticamente
}

function drawScore() {
    ctx.fillStyle = "#fff"; // Colore bianco per il testo
    ctx.font = '40px Arial';
    ctx.fillText(`${leftScore}`, canvas.width / 4, 50);
    ctx.fillText(`${rightScore}`, 3 * canvas.width / 4, 50);
}

function drawGameOver() {
    if (!gameRunning && winner) {
        // Sfondo semi-trasparente
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Riquadro centrale
        ctx.fillStyle = "#333";
        ctx.fillRect(canvas.width/2 - 200, canvas.height/2 - 100, 400, 200);
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width/2 - 200, canvas.height/2 - 100, 400, 200);
        
        // Testo vincitore
        ctx.fillStyle = "#FFD700"; 
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("🏆 GAME OVER! 🏆", canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.fillStyle = "#FFF";
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`${winner} WINS!`, canvas.width / 2, canvas.height / 2);
        
        ctx.fillStyle = "#CCC";
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${leftScore} - ${rightScore}`, canvas.width / 2, canvas.height / 2 + 30);
        
        ctx.fillStyle = "#FFD700";
        ctx.font = 'bold 18px Arial';
        ctx.fillText('Press R to RESTART', canvas.width / 2, canvas.height / 2 + 60);
        
        ctx.textAlign = 'left'; // Reset alignment
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Disegna sempre gli elementi del gioco
    ctx.fillStyle = "#fff";
    leftPaddle.draw(ctx);
    rightPaddle.draw(ctx);
    ball.draw(ctx);
    drawScore();

    // Se il gioco è finito, mostra game over e continua a ridisegnare
    if (!gameRunning) {
        drawGameOver();
        requestAnimationFrame(gameLoop); // CONTINUA IL LOOP per vedere il game over
        return;
    }

    // Muovi paddle solo se il gioco è in corso
    if (gameRunning) {
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
        ) 
        {
            // Calcola dove ha colpito la palla sul paddle (0 = top, 1 = bottom)
            const hitPoint = (ball.y - leftPaddle.y) / leftPaddle.height;
            
            // Se colpisce nel centro del paddle (tra 0.4 e 0.6), tiro dritto
            if (hitPoint >= 0.45 && hitPoint <= 0.55) {
                ball.dy = 0; // Tiro perfettamente orizzontale
                ball.dx = 30;  // Velocità maggiore per il tiro dritto
                console.log('🎯 TIRO DRITTO! Hit point:', hitPoint.toFixed(2));
            } else {
                // Tiro normale con angolo
                ball.dy *= 1.2;
                ball.dx *= -1;
            }
            
            ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
        }

        // Collisione con paddle destro
        if (
            ball.dx > 0 && // la palla si muove verso destra
            ball.x + ball.radius > rightPaddle.x &&
            ball.x + ball.radius < rightPaddle.x + rightPaddle.width && // la palla non ha già superato il bordo
            ball.y > rightPaddle.y &&
            ball.y < rightPaddle.y + rightPaddle.height
        ) 
        {
            // Calcola dove ha colpito la palla sul paddle (0 = top, 1 = bottom)
            const hitPoint = (ball.y - rightPaddle.y) / rightPaddle.height;
            
            // Se colpisce nel centro del paddle (tra 0.4 e 0.6), tiro dritto
            if (hitPoint >= 0.45 && hitPoint <= 0.55) {
                ball.dy = 0; // Tiro perfettamente orizzontale
                ball.dx = -30; // Velocità maggiore per il tiro dritto (verso sinistra)
                console.log('🎯 TIRO DRITTO AI! Hit point:', hitPoint.toFixed(2));
            } else {
                // Tiro normale con angolo
                ball.dx *= -1;
            }
            
            ball.x = rightPaddle.x - ball.radius;
        }

        // Punto per destra
        if (ball.x - ball.radius < 0) {
            printBallGoalY();
            rightScore++;
            if (checkWinCondition()) {
                // Non fare return qui, lascia che il loop continui per mostrare game over
            } else {
                resetBall();
            }
        }
        // Punto per sinistra
        if (ball.x + ball.radius > canvas.width) {
            printBallGoalY();
            leftScore++;
            if (checkWinCondition()) {
                // Non fare return qui, lascia che il loop continui per mostrare game over
            } else {
                resetBall();
            }
        }
    }

    // Continua sempre il loop
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
    // Ferma l'AI precedente se esiste
    if (enemyInterval) {
        window.clearInterval(enemyInterval);
    }
    
    // Ferma tutti i moveInterval precedenti
    moveIntervals.forEach(interval => window.clearInterval(interval));
    moveIntervals = [];
    
    // Esegui ogni 1000 ms
    enemyInterval = window.setInterval(() => 
		{
        // Calcola solo se la palla va verso destra E il gioco è in corso
        if (ball.dx > 0 && gameRunning) 
		{
            // Calcola dove la palla colpirà il muro destro
            // Formula retta: y = m*x + q
            // m = ball.dy / ball.dx
            // q = ball.y - m * ball.x
			let m = ball.dy / ball.dx;
			let q = 0;
			let x_wall = 0;
			let y_wall = 0;
			if (ball.dy == 0)
				y_wall = ball.y;
			else if (ball.dy > 0)
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
            const moveInterval = window.setInterval(() => {
                // Se il gioco si ferma, ferma anche il movimento dell'AI
                if (!gameRunning) {
                    upPressed = false;
                    downPressed = false;
                    window.clearInterval(moveInterval);
                    // Rimuovi dall'array di tracciamento
                    const index = moveIntervals.indexOf(moveInterval);
                    if (index > -1) moveIntervals.splice(index, 1);
                    return;
                }
                
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
                    window.clearInterval(moveInterval);
                    // Rimuovi dall'array di tracciamento
                    const index = moveIntervals.indexOf(moveInterval);
                    if (index > -1) moveIntervals.splice(index, 1);
                }
            }, 1); // 1 ms per step
            
            // Aggiungi all'array di tracciamento
            moveIntervals.push(moveInterval);
        }
    }, 1000);
}

resetBall();
enemy();
gameLoop();
