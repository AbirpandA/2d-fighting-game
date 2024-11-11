// Initialize canvas and get the drawing context
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');

// Game physics and state variables
const gravity = 0.5;
let lastKey;
let gameOver = false;
let gameStarted = false;
let playerHit = false;

const keys = {
    a: { pressed: false },
    d: { pressed: false },
    w: { pressed: false },
};

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
            offset,
            width: 100,
            height: 50,
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
        
        // New attack cooldown properties
        this.attackCooldown = 500;     // Regular attack cooldown in milliseconds
        this.specialCooldown = 1000;   // Special attack cooldown in milliseconds
        this.canAttack = true;         // Flag to track if player can attack
        this.canSpecialAttack = true;  // Flag to track if player can special attack
    }

    // Render the character and its attack box
    draw() {
        // Flash effect when character is hit
        if (this.hitTimer > 0) {
            c.fillStyle = 'white';
            c.globalAlpha = 0.3;
        } else {
            c.fillStyle = this.color;
            c.globalAlpha = 1;
        }

        // Draw the character body
        c.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Draw attack animations
        if (this.isAttacking) {
            c.fillStyle = 'yellow';
            c.fillRect(this.attackbox.position.x, this.attackbox.position.y, this.attackbox.width*1.3, this.attackbox.height);
        } else if (this.isSpecialAttacking) {
            c.fillStyle = 'orange';
            c.fillRect(this.attackbox.position.x, this.attackbox.position.y, this.attackbox.width, this.attackbox.height);
        }

        // Draw cooldown indicators
        if (!this.canAttack || !this.canSpecialAttack) {
            c.fillStyle = 'rgba(255, 0, 0, 0.3)';
            c.fillRect(this.position.x, this.position.y - 10, this.width, 5);
        }

        c.globalAlpha = 1;
    }

    // Modified attack method with cooldown
    attack() {
        if (this.stunned || !this.canAttack) return;
        
        this.isAttacking = true;
        this.currentAttack = 'normal';
        this.canAttack = false;
        
        // Reset attack state and cooldown
        setTimeout(() => {
            this.isAttacking = false;
            this.currentAttack = null;
        }, 120);

        setTimeout(() => {
            this.canAttack = true;
        }, this.attackCooldown);
    }

    // Modified special attack method with cooldown
    specialAttack() {
        if (this.stunned || !this.canSpecialAttack) return;
        
        this.isSpecialAttacking = true;
        this.currentAttack = 'special';
        this.canSpecialAttack = false;
        
        // Reset attack state and cooldown
        setTimeout(() => {
            this.isSpecialAttacking = false;
            this.currentAttack = null;
        }, 150);

        setTimeout(() => {
            this.canSpecialAttack = true;
        }, this.specialCooldown);
    }

    // Rest of the fighter class methods remain the same...
    takeDamage(damage) {
        const comboDamage = damage * (1 + Math.min(this.comboCount * 0.1, 0.5));
        this.health -= comboDamage;
        if (this.health < 0) this.health = 0;
        
        this.hitTimer = 10;
        this.stunned = true;
        this.recoveryTime = 20;        
        this.velocity.x = 0;           
    }

    performAIAction(player) {
        if (this.stunned || this.recoveryTime > 0) {
            this.recoveryTime--;
            if (this.recoveryTime <= 0) this.stunned = false;
            return;
        }

        const distanceToPlayer = Math.abs(player.position.x - this.position.x);
        const currentTime = Date.now();
        const timeSinceLastAttack = currentTime - this.lastAttackTime;

        if (this.health < 30) {
            if (distanceToPlayer < 150) {
                if (this.velocity.y === 0 && Math.random() < 0.1) {
                    this.velocity.y = -15;
                    this.velocity.x = player.position.x > this.position.x ? -2 : 2;
                }
            }
        }

        if (player.stunned || player.recoveryTime > 0) {
            if (distanceToPlayer < 120 && timeSinceLastAttack > 500) {
                if (Math.random() < 0.7) {
                    this.attack();
                    this.lastAttackTime = currentTime;
                }
            }
        }

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
            const approachSpeed = 1 + (Math.random() * 0.5);
            this.velocity.x = player.position.x > this.position.x ? approachSpeed : -approachSpeed;
            
            if (this.velocity.y === 0 && Math.random() < 0.05) {
                this.velocity.y = -12;
            }
        } else {
            this.velocity.x = player.position.x > this.position.x ? 2 : -2;
        }

        if (this.position.x < 50) this.velocity.x = 1;
        if (this.position.x > canvas.width - 100) this.velocity.x = -1;
    }

    update() {
        this.draw();
        
        this.attackbox.position.x = this.position.x + this.attackbox.offset.x;
        this.attackbox.position.y = this.position.y;

        const nextX = this.position.x + this.velocity.x;
        if (nextX >= 0 && nextX <= canvas.width - this.width) {
            this.position.x = nextX;
        }
        this.position.y += this.velocity.y;

        if (this.position.y + this.height + this.velocity.y >= canvas.height) {
            this.velocity.y = 0;
            this.position.y = canvas.height - this.height;
        } else {
            this.velocity.y += gravity;
        }

        if (this.hitTimer > 0) this.hitTimer -= 0.1;
        if (this.recoveryTime > 0) {
            this.recoveryTime--;
            if(this.recoveryTime <= 0) {
                this.stunned = false;
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