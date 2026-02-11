// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const MAX_INITIAL_ANGLE = Math.PI / 6; // 30 degrees
const MAX_BOUNCE_ANGLE = Math.PI / 3; // 60 degrees
const BASE_POINTS = 10;

// Game state
let gameState = 'ready'; // ready, playing, paused, gameOver, win
let score = 0;
let lives = 3;

// Paddle
const paddle = {
    width: 100,
    height: 15,
    x: 0,
    y: 0,
    speed: 7,
    dx: 0
};

// Ball
const ball = {
    x: 0,
    y: 0,
    radius: 8,
    speed: 4,
    dx: 0,
    dy: 0
};

// Bricks
const brick = {
    rows: 5,
    cols: 9,
    width: 75,
    height: 25,
    padding: 15,
    offsetX: 40,
    offsetY: 60,
    visible: []
};

// Colors for different brick rows
const brickColors = ['#FF6B6B', '#FFA500', '#FFD700', '#4ECDC4', '#45B7D1'];

// Initialize brick visibility
function initBricks() {
    brick.visible = [];
    for (let row = 0; row < brick.rows; row++) {
        brick.visible[row] = [];
        for (let col = 0; col < brick.cols; col++) {
            brick.visible[row][col] = true;
        }
    }
}

// Initialize game
function init() {
    // Set paddle position
    paddle.x = canvas.width / 2 - paddle.width / 2;
    paddle.y = canvas.height - paddle.height - 20;
    
    // Set ball position
    resetBall();
    
    // Initialize bricks
    initBricks();
    
    // Reset score if starting new game
    if (gameState === 'ready') {
        score = 0;
        lives = 3;
        updateScore();
        updateLives();
    }
}

// Reset ball position
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = paddle.y - ball.radius;
    const angle = (Math.random() * MAX_INITIAL_ANGLE * 2) - MAX_INITIAL_ANGLE;
    ball.dx = ball.speed * Math.sin(angle);
    ball.dy = -ball.speed * Math.cos(angle);
}

// Draw paddle
function drawPaddle() {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Add gradient effect
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, '#CCCCCC');
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// Draw ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.closePath();
    
    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

// Draw bricks
function drawBricks() {
    for (let row = 0; row < brick.rows; row++) {
        for (let col = 0; col < brick.cols; col++) {
            if (brick.visible[row][col]) {
                const brickX = col * (brick.width + brick.padding) + brick.offsetX;
                const brickY = row * (brick.height + brick.padding) + brick.offsetY;
                
                ctx.fillStyle = brickColors[row];
                ctx.fillRect(brickX, brickY, brick.width, brick.height);
                
                // Add border
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(brickX, brickY, brick.width, brick.height);
            }
        }
    }
}

// Move paddle
function movePaddle() {
    paddle.x += paddle.dx;
    
    // Wall collision detection
    if (paddle.x < 0) {
        paddle.x = 0;
    }
    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// Move ball
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Wall collision (left and right)
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx *= -1;
    }
    
    // Wall collision (top)
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }
    
    // Paddle collision
    if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width &&
        ball.dy > 0
    ) {
        // Calculate hit position on paddle (-1 to 1)
        const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        // Change angle based on hit position
        const angle = hitPos * MAX_BOUNCE_ANGLE;
        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -ball.speed * Math.cos(angle);
    }
    
    // Bottom collision (lose a life)
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        updateLives();
        
        if (lives <= 0) {
            gameState = 'gameOver';
            showMessage('ゲームオーバー！', 'lose');
        } else {
            resetBall();
            gameState = 'ready';
        }
    }
}

// Brick collision detection
function brickCollision() {
    for (let row = 0; row < brick.rows; row++) {
        for (let col = 0; col < brick.cols; col++) {
            if (brick.visible[row][col]) {
                const brickX = col * (brick.width + brick.padding) + brick.offsetX;
                const brickY = row * (brick.height + brick.padding) + brick.offsetY;
                
                if (
                    ball.x + ball.radius > brickX &&
                    ball.x - ball.radius < brickX + brick.width &&
                    ball.y + ball.radius > brickY &&
                    ball.y - ball.radius < brickY + brick.height
                ) {
                    ball.dy *= -1;
                    brick.visible[row][col] = false;
                    score += (brick.rows - row) * BASE_POINTS;
                    updateScore();
                    
                    // Check for win
                    if (checkWin()) {
                        gameState = 'win';
                        showMessage('おめでとう！全てのブロックを破壊しました！', 'win');
                    }
                }
            }
        }
    }
}

// Check if all bricks are destroyed
function checkWin() {
    for (let row = 0; row < brick.rows; row++) {
        for (let col = 0; col < brick.cols; col++) {
            if (brick.visible[row][col]) {
                return false;
            }
        }
    }
    return true;
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = score;
}

// Update lives display
function updateLives() {
    document.getElementById('lives').textContent = lives;
}

// Show message
function showMessage(text, className = '') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = 'message ' + className;
}

// Clear message
function clearMessage() {
    const messageEl = document.getElementById('message');
    messageEl.textContent = '';
    messageEl.className = 'message';
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawBricks();
    drawPaddle();
    drawBall();
}

// Update game
function update() {
    if (gameState === 'playing') {
        movePaddle();
        moveBall();
        brickCollision();
    }
    
    draw();
    requestAnimationFrame(update);
}

// Keyboard event handlers
function keyDown(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        paddle.dx = -paddle.speed;
    } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (gameState === 'ready') {
            gameState = 'playing';
            clearMessage();
        } else if (gameState === 'gameOver' || gameState === 'win') {
            gameState = 'ready';
            init();
            clearMessage();
        }
    }
}

function keyUp(e) {
    if (
        e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ||
        e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'
    ) {
        paddle.dx = 0;
    }
}

// Button click handler
document.getElementById('startButton').addEventListener('click', () => {
    if (gameState === 'ready') {
        gameState = 'playing';
        clearMessage();
    } else if (gameState === 'gameOver' || gameState === 'win') {
        gameState = 'ready';
        init();
        clearMessage();
    }
});

// Keyboard event listeners
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// Initialize and start game loop
init();
update();
