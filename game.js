// Initialize canvas and get the drawing context
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');

// Game physics and state variables
const gravity = 0.5;       // Gravity force applied to jumping/falling
let lastKey;              // Tracks the last key pressed
let gameOver = false;     // Controls game over state
let gameStarted = false;  // Controls if game has begun
let playerHit = false;    // Tracks player damage state

// Key state tracking for smooth movement controls
const keys = {
    a: { pressed: false },  // Left movement
    d: { pressed: false },  // Right movement
    w: { pressed: false },  // Jump
};

// Main Sprite class for both player and enemy characters
class fighter {
    constructor({ position, velocity, color = 'red', offset, health = 100 }) {
        // Basic character properties
        this.position = position;
        this.velocity = velocity;
        this.height = 150;
        this.width = 50;
        this.color = color;
        
        // Attack hitbox configuration
        this.attackbox = {
            position: { x: this.position.x, y: this.position.y },
            offset,              // Offset from character position
            width: 100,         // Attack range
            height: 50,         // Attack height
        };
        
        // Combat state properties
        this.isAttacking = false;
        this.isSpecialAttacking = false;
        this.health = health;
        this.currentAttack = null;
        this.hitTimer = 0;
        this.stunned = false;          
        this.lastAttackTime = 0;       
        this.comboCount = 0;           
        this.recoveryTime = 0;         
    }

    // Render the character and its attack box
    draw() {
        // Flash effect when character is hit
        if (this.hitTimer > 0) {
            c.fillStyle = 'white';  
            c.globalAlpha = 0.3;    // Semi-transparent for hit effect
        } else {
            c.fillStyle = this.color;
            c.globalAlpha = 1;
        }

        // Draw the character body
        c.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Draw attack animations
        if (this.isAttacking) {
            c.fillStyle = 'yellow';  // Normal attack visualization
            c.fillRect(this.attackbox.position.x, this.attackbox.position.y, this.attackbox.width*1.3, this.attackbox.height);
        } else if (this.isSpecialAttacking) {
            c.fillStyle = 'orange';  // Special attack visualization
            c.fillRect(this.attackbox.position.x, this.attackbox.position.y, this.attackbox.width , this.attackbox.height);
        }

        c.globalAlpha = 1;  // Reset transparency
    }

    // Handle damage calculation and effects
    takeDamage(damage) {
        // Calculate damage with combo multiplier
        const comboDamage = damage * (1 + Math.min(this.comboCount * 0.1, 0.5));
        this.health -= comboDamage;
        if (this.health < 0) this.health = 0;
        
        // Apply hit effects
        this.hitTimer = 10;
        this.stunned = true;
        this.recoveryTime = 20;        
        this.velocity.x = 0;           
    }

    // Execute normal attack
    attack() {
        if(this.stunned) return;
        this.isAttacking = true;
        this.currentAttack = 'normal';
        // Reset attack state after delay
        setTimeout(() => {
            this.isAttacking = false;
            this.currentAttack = null;
        }, 120);
    }

    // Execute special attack
    specialAttack() {
        if(this.stunned) return;
        this.isSpecialAttacking = true;
        this.currentAttack = 'special';
        // Reset attack state after delay
        setTimeout(() => {
            this.isSpecialAttacking = false;
            this.currentAttack = null;
        }, 150);
    }

    // Enemy AI decision making and actions
    performAIAction(player) {
        // Skip AI if stunned or recovering
        if (this.stunned || this.recoveryTime > 0) {
            this.recoveryTime--;
            if (this.recoveryTime <= 0) this.stunned = false;
            return;
        }

        const distanceToPlayer = Math.abs(player.position.x - this.position.x);
        const currentTime = Date.now();
        const timeSinceLastAttack = currentTime - this.lastAttackTime;

        // Defensive behavior when low health
        if (this.health < 30) {
            if (distanceToPlayer < 150) {
                if (this.velocity.y === 0 && Math.random() < 0.1) {
                    this.velocity.y = -15;  // Jump away
                    this.velocity.x = player.position.x > this.position.x ? -2 : 2;
                }
            }
        }

        // Aggressive behavior against vulnerable player
        if (player.stunned || player.recoveryTime > 0) {
            if (distanceToPlayer < 120 && timeSinceLastAttack > 500) {
                if (Math.random() < 0.7) {
                    this.attack();
                    this.lastAttackTime = currentTime;
                }
            }
        }

        // Standard combat behavior
        if (distanceToPlayer < 150) {
            if (timeSinceLastAttack > 800) {
                if (Math.random() < 0.15) {
                    this.specialAttack();
                    this.lastAttackTime = currentTime;
                } else if (Math.random() < 0.3) {
                    this.attack();
                    this.lastAttackTime = currentTime;
                }
            }
        } else if (distanceToPlayer < 300) {
            // Approach player with dynamic movement
            const approachSpeed = 1 + (Math.random() * 0.5);
            this.velocity.x = player.position.x > this.position.x ? approachSpeed : -approachSpeed;
            
            // Random jumps while approaching
            if (this.velocity.y === 0 && Math.random() < 0.05) {
                this.velocity.y = -12;
            }
        } else {
            // Chase player when far away
            this.velocity.x = player.position.x > this.position.x ? 2 : -2;
        }

        // Prevent AI from going off-screen
        if (this.position.x < 50) this.velocity.x = 1;
        if (this.position.x > canvas.width - 100) this.velocity.x = -1;
    }

    // Update sprite physics and state
    update() {
        this.draw();
        
        // Update attack hitbox position
        this.attackbox.position.x = this.position.x + this.attackbox.offset.x;
        this.attackbox.position.y = this.position.y;

        // Handle horizontal movement with boundary checking
        const nextX = this.position.x + this.velocity.x;
        if (nextX >= 0 && nextX <= canvas.width - this.width) {
            this.position.x = nextX;
        }
        this.position.y += this.velocity.y;

        // Ground collision and gravity
        if (this.position.y + this.height + this.velocity.y >= canvas.height) {
            this.velocity.y = 0;
            this.position.y = canvas.height - this.height;
        } else {
            this.velocity.y += gravity;
        }

        // Update effect timers
        if (this.hitTimer > 0) this.hitTimer -= 0.1;
        if (this.recoveryTime > 0) {
            this.recoveryTime--;
            if(this.recoveryTime<=0){
                this.stunned=false;
            }
        }
    }
}

// Initialize player character
const player = new fighter({
    position: { x: 50, y: 0 },
    velocity: { x: 0, y: 0 },
    color: 'red',
    offset: { x: 0, y: 0 },
    health: 100,
});

// Initialize enemy character
const enemy = new fighter({
    position: { x: 1100, y: 0 },
    velocity: { x: 0, y: 0 },
    color: 'blue',
    offset: { x: -50, y: 0 },
    health: 100,
});

// Draw health bars with visual effects
function drawHealthBars() {
    // Background bar
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, 30);

    // Health bar backgrounds
    c.fillStyle = '#500000';
    c.fillRect(10, 5, canvas.width / 2 - 20, 20);
    c.fillStyle = '#000050';
    c.fillRect(canvas.width / 2 + 10, 5, canvas.width / 2 - 20, 20);

    // Calculate health bar widths
    const playerHealthWidth = (canvas.width / 2 - 20) * (player.health / 100);
    const enemyHealthWidth = (canvas.width / 2 - 20) * (enemy.health / 100);

    // Player health gradient
    const playerGradient = c.createLinearGradient(10, 0, playerHealthWidth, 0);
    playerGradient.addColorStop(0, '#ff0000');
    playerGradient.addColorStop(1, '#ff6666');
    c.fillStyle = playerGradient;
    c.fillRect(10, 5, playerHealthWidth, 20);

    // Enemy health gradient
    const enemyGradient = c.createLinearGradient(canvas.width / 2 + 10, 0, canvas.width / 2 + 10 + enemyHealthWidth, 0);
    enemyGradient.addColorStop(0, '#0000ff');
    enemyGradient.addColorStop(1, '#6666ff');
    c.fillStyle = enemyGradient;
    c.fillRect(canvas.width / 2 + 10, 5, enemyHealthWidth, 20);

    // VS label
    c.fillStyle = 'black';
    c.fillRect(canvas.width / 2 - 15, 0, 30, 30);
    c.fillStyle = 'white';
    c.font = '20px Arial';
    c.fillText('VS', canvas.width / 2 - 12, 22);

    // Health percentage display
    c.font = '16px Arial';
    c.fillStyle = 'white';
    c.fillText(`${Math.ceil(player.health)}%`, 15, 21);
    c.fillText(`${Math.ceil(enemy.health)}%`, canvas.width - 60, 21);
}

// Display game messages
function displayMessage(message, color) {
    c.fillStyle = color;
    c.font = '30px Arial';
    c.fillText(message, canvas.width / 2 - c.measureText(message).width / 2, canvas.height / 2);
}

// Initial game start screen
function gameStart() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    displayMessage("Press 'Enter' to Start", 'black');
}

// Game over screen display
function gameOverScreen() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    if (player.health <= 0) {
        displayMessage("Game Over! You Lost. Press 'R' to Restart", 'red');
    } else {
        displayMessage("Game Over! You Won. Press 'R' to Restart", 'green');
    }
}

// Main game loop
// Update the animation loop to store the animation frame ID
function animate() {
    if (!gameStarted) return;

    window.animationFrameId = window.requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);

    drawHealthBars();

    player.update();
    enemy.update();

    // Player movement handling with improved control
    player.velocity.x = 0; // Reset velocity before checking keys
    if (keys.d.pressed) player.velocity.x = 3;
    if (keys.a.pressed) player.velocity.x = -3;

    // Check for player hitting enemy
    if (
        player.currentAttack &&
        player.attackbox.position.x + player.attackbox.width >= enemy.position.x &&
        player.attackbox.position.x <= enemy.position.x + enemy.width &&
        player.attackbox.position.y + player.attackbox.height >= enemy.position.y &&
        player.attackbox.position.y <= enemy.position.y + enemy.height
    ) {
        enemy.takeDamage(player.currentAttack === 'special' ? 20 : 10);
        player.currentAttack = null;
    }

    // Check for enemy hitting player
    if (
        enemy.currentAttack &&
        enemy.attackbox.position.x + enemy.attackbox.width >= player.position.x &&
        enemy.attackbox.position.x <= player.position.x + player.width &&
       enemy.attackbox.position.y +enemy.attackbox.height >= player.position.y &&
       enemy.attackbox.position.y <= player.position.y + player.height
    ) {
        player.takeDamage(enemy.currentAttack === 'special' ? 20 : 10);
        enemy.currentAttack = null;
    }

    // Check game over condition
    if (player.health <= 0 || enemy.health <= 0) {
        gameOver = true;
        gameOverScreen();
        return;
    }

    enemy.performAIAction(player);
}

// Reset game to initial state with complete state clearing
function resetGame() {
    // Reset game state flags
    gameOver = false;
    gameStarted = false;
    playerHit = false;

    // Reset all key states
    keys.a.pressed = false;
    keys.d.pressed = false;
    keys.w.pressed = false;

    // Reset player state completely
    player.health = 100;
    player.position = { x: 50, y: 0 };
    player.velocity = { x: 0, y: 0 };
    player.isAttacking = false;
    player.isSpecialAttacking = false;
    player.currentAttack = null;
    player.hitTimer = 0;
    player.stunned = false;
    player.lastAttackTime = 0;
    player.comboCount = 0;
    player.recoveryTime = 0;

    // Reset enemy state completely
    enemy.health = 100;
    enemy.position = { x: 700, y: 0 };
    enemy.velocity = { x: 0, y: 0 };
    enemy.isAttacking = false;
    enemy.isSpecialAttacking = false;
    enemy.currentAttack = null;
    enemy.hitTimer = 0;
    enemy.stunned = false;
    enemy.lastAttackTime = 0;
    enemy.comboCount = 0;
    enemy.recoveryTime = 0;

    // Clear any existing animation frame before starting new one
    if (window.animationFrameId) {
        cancelAnimationFrame(window.animationFrameId);
    }

    // Show the start screen
    gameStart();
}

// Handle keyboard input
window.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !gameStarted) {
        gameStarted = true;
        animate();
    }

    if (event.key === 'd') {
        keys.d.pressed = true;
    }
    if (event.key === 'a') {
        keys.a.pressed = true;
    }
    if (event.key === 'w' && player.velocity.y === 0) {
        player.velocity.y = -15;
    }
    if (event.key === ' ') {
        player.attack();
    }
    if (event.key === 'q' || event.key === 'Q') { // Special attack with Q key
        player.specialAttack();
    }

    if (event.key === 'r' && gameOver) {
        resetGame();
    }
});

// Handle key release events
window.addEventListener('keyup', (event) => {
    if (event.key === 'd') {
        keys.d.pressed = false;
    }
    if (event.key === 'a') {
        keys.a.pressed = false; // Fixed from previous incorrect d.pressed
    }
    if (event.key === 'w') {
        keys.w.pressed = false;
    }
});

// Initialize game
gameStart();