// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRID_SIZE = 20;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const ROWS = CANVAS_HEIGHT / GRID_SIZE;
const COLS = CANVAS_WIDTH / GRID_SIZE;

// Game state
let gameRunning = true;
let score = 0;
let lives = 3;
let level = 1;
let pelletsRemaining = 0;

// Game maze layout (1 = wall, 0 = empty, 2 = pellet, 3 = power pellet)
const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,0,0,2,1,1,2,1,1,1,1,1,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,1,2,1,1,2,2,2,2,2,2,2,2,2,1,0,0,0,2,2,2,2,2,2,2,2,2,1,1,2,1,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,2,1,1,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,1,2,1,1,2,1,1,1,1,1,1],
    [2,2,2,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,2,2,2,2,2,2,2,2],
    [1,1,1,1,1,1,2,1,1,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,1,2,1,1,2,1,1,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,1,2,1,1,2,1,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,2,2,2,2,2,2,2,2,2,1,0,0,0,1,2,2,2,2,2,2,2,2,1,1,2,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,1,1,1,1,1,1,1,2,1,1,2,1,1,0,0,2,1,1,2,1,1,1,1,1,1,1,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,2,2,2,2,2,1],
    [1,3,1,1,1,1,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,1,1,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Pac-Man object
const pacman = {
    x: 20,
    y: 14,
    direction: 0, // 0: right, 1: down, 2: left, 3: up
    nextDirection: 0,
    mouthOpen: true,
    animationCounter: 0
};

// Ghost objects
const ghosts = [
    { x: 19, y: 9, direction: 0, color: '#FF0000', mode: 'chase', modeTimer: 0 },
    { x: 20, y: 9, direction: 2, color: '#FFB8FF', mode: 'chase', modeTimer: 0 },
    { x: 19, y: 10, direction: 3, color: '#00FFFF', mode: 'chase', modeTimer: 0 },
    { x: 20, y: 10, direction: 1, color: '#FFB852', mode: 'chase', modeTimer: 0 }
];

// Power pellet effect
let powerMode = false;
let powerModeTimer = 0;
const POWER_MODE_DURATION = 300; // frames

// Direction vectors
const directions = [
    { x: 1, y: 0 },   // right
    { x: 0, y: 1 },   // down
    { x: -1, y: 0 },  // left
    { x: 0, y: -1 }   // up
];

// Initialize game
function init() {
    countPellets();
    gameLoop();
}

function countPellets() {
    pelletsRemaining = 0;
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 2 || maze[y][x] === 3) {
                pelletsRemaining++;
            }
        }
    }
}

// Input handling
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowRight':
            pacman.nextDirection = 0;
            break;
        case 'ArrowDown':
            pacman.nextDirection = 1;
            break;
        case 'ArrowLeft':
            pacman.nextDirection = 2;
            break;
        case 'ArrowUp':
            pacman.nextDirection = 3;
            break;
    }
});

function canMoveTo(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
        return x < 0 || x >= COLS; // Allow horizontal wrapping
    }
    return maze[y] && (maze[y][x] === 0 || maze[y][x] === 2 || maze[y][x] === 3);
}

function updatePacman() {
    // Try to change direction
    const nextDir = directions[pacman.nextDirection];
    const nextX = pacman.x + nextDir.x;
    const nextY = pacman.y + nextDir.y;
    
    if (canMoveTo(nextX, nextY)) {
        pacman.direction = pacman.nextDirection;
    }
    
    // Move in current direction
    const dir = directions[pacman.direction];
    const newX = pacman.x + dir.x;
    const newY = pacman.y + dir.y;
    
    if (canMoveTo(newX, newY)) {
        pacman.x = newX;
        pacman.y = newY;
        
        // Handle screen wrapping
        if (pacman.x < 0) pacman.x = COLS - 1;
        if (pacman.x >= COLS) pacman.x = 0;
        
        // Check for pellet collection
        if (maze[pacman.y] && maze[pacman.y][pacman.x] === 2) {
            maze[pacman.y][pacman.x] = 0;
            score += 10;
            pelletsRemaining--;
        } else if (maze[pacman.y] && maze[pacman.y][pacman.x] === 3) {
            maze[pacman.y][pacman.x] = 0;
            score += 50;
            pelletsRemaining--;
            activatePowerMode();
        }
    }
    
    // Animation
    pacman.animationCounter++;
    if (pacman.animationCounter % 10 === 0) {
        pacman.mouthOpen = !pacman.mouthOpen;
    }
}

function activatePowerMode() {
    powerMode = true;
    powerModeTimer = POWER_MODE_DURATION;
    ghosts.forEach(ghost => {
        ghost.mode = 'flee';
        // Reverse ghost direction
        ghost.direction = (ghost.direction + 2) % 4;
    });
}

function updateGhosts() {
    if (powerMode) {
        powerModeTimer--;
        if (powerModeTimer <= 0) {
            powerMode = false;
            ghosts.forEach(ghost => {
                ghost.mode = 'chase';
            });
        }
    }
    
    ghosts.forEach(ghost => {
        // Simple AI: change direction randomly or chase Pac-Man
        if (Math.random() < 0.1) {
            const possibleDirections = [];
            for (let i = 0; i < 4; i++) {
                const dir = directions[i];
                const newX = ghost.x + dir.x;
                const newY = ghost.y + dir.y;
                if (canMoveTo(newX, newY) && i !== (ghost.direction + 2) % 4) {
                    possibleDirections.push(i);
                }
            }
            
            if (possibleDirections.length > 0) {
                if (ghost.mode === 'chase' && !powerMode) {
                    // Simple chase AI
                    let bestDirection = possibleDirections[0];
                    let bestDistance = Infinity;
                    
                    possibleDirections.forEach(dir => {
                        const testDir = directions[dir];
                        const testX = ghost.x + testDir.x;
                        const testY = ghost.y + testDir.y;
                        const distance = Math.abs(testX - pacman.x) + Math.abs(testY - pacman.y);
                        
                        if (distance < bestDistance) {
                            bestDistance = distance;
                            bestDirection = dir;
                        }
                    });
                    
                    ghost.direction = bestDirection;
                } else {
                    // Flee mode or random movement
                    ghost.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
                }
            }
        }
        
        // Move ghost
        const dir = directions[ghost.direction];
        const newX = ghost.x + dir.x;
        const newY = ghost.y + dir.y;
        
        if (canMoveTo(newX, newY)) {
            ghost.x = newX;
            ghost.y = newY;
            
            // Handle screen wrapping
            if (ghost.x < 0) ghost.x = COLS - 1;
            if (ghost.x >= COLS) ghost.x = 0;
        } else {
            // Change direction if can't move
            ghost.direction = Math.floor(Math.random() * 4);
        }
    });
}

function checkCollisions() {
    ghosts.forEach((ghost, index) => {
        if (ghost.x === pacman.x && ghost.y === pacman.y) {
            if (powerMode && ghost.mode === 'flee') {
                // Eat ghost
                score += 200;
                ghost.x = 19 + (index % 2);
                ghost.y = 9 + Math.floor(index / 2);
                ghost.mode = 'chase';
            } else if (!powerMode) {
                // Pac-Man dies
                lives--;
                resetPositions();
                
                if (lives <= 0) {
                    gameOver();
                }
            }
        }
    });
}

function resetPositions() {
    pacman.x = 20;
    pacman.y = 14;
    pacman.direction = 0;
    pacman.nextDirection = 0;
    
    ghosts.forEach((ghost, index) => {
        ghost.x = 19 + (index % 2);
        ghost.y = 9 + Math.floor(index / 2);
        ghost.direction = index % 4;
        ghost.mode = 'chase';
    });
    
    powerMode = false;
    powerModeTimer = 0;
}

function drawMaze() {
    ctx.fillStyle = '#0000FF';
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 1) {
                ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }
}

function drawPellets() {
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 2) {
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(
                    x * GRID_SIZE + GRID_SIZE / 2,
                    y * GRID_SIZE + GRID_SIZE / 2,
                    2, 0, Math.PI * 2
                );
                ctx.fill();
            } else if (maze[y][x] === 3) {
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(
                    x * GRID_SIZE + GRID_SIZE / 2,
                    y * GRID_SIZE + GRID_SIZE / 2,
                    8, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
}

function drawPacman() {
    const centerX = pacman.x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = pacman.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2 - 2;
    
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    
    if (pacman.mouthOpen) {
        const mouthAngle = Math.PI / 3;
        const startAngle = pacman.direction * Math.PI / 2 - mouthAngle / 2;
        const endAngle = pacman.direction * Math.PI / 2 + mouthAngle / 2;
        
        ctx.arc(centerX, centerY, radius, endAngle, startAngle);
        ctx.lineTo(centerX, centerY);
    } else {
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    }
    
    ctx.fill();
}

function drawGhosts() {
    ghosts.forEach(ghost => {
        const centerX = ghost.x * GRID_SIZE + GRID_SIZE / 2;
        const centerY = ghost.y * GRID_SIZE + GRID_SIZE / 2;
        const radius = GRID_SIZE / 2 - 2;
        
        if (powerMode && ghost.mode === 'flee') {
            ctx.fillStyle = powerModeTimer > 60 ? '#0000FF' : 
                           (Math.floor(powerModeTimer / 10) % 2 ? '#0000FF' : '#FFFFFF');
        } else {
            ctx.fillStyle = ghost.color;
        }
        
        // Draw ghost body
        ctx.beginPath();
        ctx.arc(centerX, centerY - 2, radius, Math.PI, 0);
        ctx.rect(centerX - radius, centerY - 2, radius * 2, radius + 2);
        
        // Draw ghost bottom (wavy)
        const waveHeight = 4;
        const waveWidth = radius / 2;
        for (let i = 0; i < 4; i++) {
            const x = centerX - radius + i * waveWidth;
            const y = centerY + radius;
            if (i % 2 === 0) {
                ctx.lineTo(x, y - waveHeight);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.lineTo(centerX + radius, centerY + radius);
        
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX - 4, centerY - 4, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 4, centerY - 4, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX - 4, centerY - 4, 1, 0, Math.PI * 2);
        ctx.arc(centerX + 4, centerY - 4, 1, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

function levelComplete() {
    gameRunning = false;
    document.getElementById('levelScore').textContent = score;
    document.getElementById('completedLevel').textContent = level;
    document.getElementById('levelComplete').style.display = 'block';
}

function nextLevel() {
    level++;
    gameRunning = true;
    document.getElementById('levelComplete').style.display = 'none';
    
    // Reset positions and restore pellets for next level
    resetPositions();
    restoreMazePellets();
    countPellets();
}

function restoreMazePellets() {
    // Reset maze (restore pellets)
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 0) {
                // Restore pellets in empty spaces (except ghost house)
                if (!(x >= 18 && x <= 21 && y >= 8 && y <= 11)) {
                    if (Math.random() < 0.8) {
                        maze[y][x] = 2;
                    }
                }
            }
        }
    }
    
    // Restore power pellets
    maze[2][1] = 3;
    maze[2][38] = 3;
    maze[16][1] = 3;
    maze[16][38] = 3;
}

function restartGame() {
    // Reset game state
    score = 0;
    lives = 3;
    level = 1;
    gameRunning = true;
    powerMode = false;
    powerModeTimer = 0;
    
    restoreMazePellets();
    resetPositions();
    countPellets();
    
    // Hide all screens
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('levelComplete').style.display = 'none';
}

function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Update game objects
    updatePacman();
    updateGhosts();
    checkCollisions();
    
    // Draw everything
    drawMaze();
    drawPellets();
    drawPacman();
    drawGhosts();
    
    // Update UI
    updateUI();
    
    // Check win condition
    if (pelletsRemaining <= 0) {
        levelComplete();
        return;
    }
    
    // Continue game loop
    setTimeout(gameLoop, 100); // ~10 FPS for classic feel
}

// Start the game
init();