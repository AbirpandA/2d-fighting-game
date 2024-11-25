// Initialize canvas and get the drawing context
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');
const groundLevel = canvas.height - 93;

// Load the background image
const backgroundImage = new Image();
let showBackground = true; // Controls background display
backgroundImage.src = 'bgsprite.gif';
const gameStory = `"Once, Elyas and Kael were inseparable—twins bound by blood, 
their souls forged in the fires of shared dreams. Elyas, a Dark Knight, once basked in glory, 
but the hollow echo of fame consumed him. He left, casting aside his title, wandering into the endless night in search of meaning. 
Kael, forever chasing what Elyas had abandoned, fell into the abyss, embracing the very shadows his brother had feared.

Time brought them back to this moment. Two brothers, now strangers, locked in a battle not of choice but of fate. 
Elyas saw a reflection of his lost self in Kael’s eyes, while Kael’s sorrow was a mirror of the brother he had lost.

Their blades clashed not in rage, but in grief. Neither could win, for their victory would only deepen the wound. 
Two hearts, forever shattered, their bond broken beyond repair.

**Press 'Enter' to witness the tragic end of two souls, forever entwined in sorrow.**"
`;

const gamemusic = new Audio('sprites/echoes.mp3');

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



// Initialize player character
const player = new Fighter({
    position: { x: 50, y: groundLevel - 150 },
    velocity: { x: 0, y: 0 },
    color: 'red',
    
    imgSrc: '/sprites/player/idle.png', // Add your player sprite path here
    scale: 2.5,
    framesMax: 6,
    health: 100,
    offset:{
        x: 80 ,
        y: 167,
    },
    sprites: {
        idle: {
            imgSrc: '/sprites/player/idle.png',
            framesMax: 6
        },
        run: {
            imgSrc: '/sprites/player/run.png',
            framesMax: 8
        },
        jump: {
            imgSrc: '/sprites/player/jump.png',
            framesMax: 5
        },
        fall: {
            imgSrc: '/sprites/player/fall.png',
            framesMax: 4
        },
        attack1: {
            imgSrc: '/sprites/player/attack1.png',
            framesMax: 4
        },
        attack2: {
            imgSrc: '/sprites/player/attack2.png',
            framesMax: 4
        },
        takeHit: {
            imgSrc: '/sprites/player/takeHit.png',
            framesMax: 3
        },
        death: {
            imgSrc: '/sprites/player/death.png',
            framesMax: 6
        }
    },
    attackBox: {
        offset: {
            x: 170,
            y: 50
        },
        width: 140,
        height: 50
    }
});

const enemy = new Fighter({
    position: { x: 700, y: groundLevel - 150 },
    velocity: { x: 0, y: 0 },
    color: 'blue',
    imgSrc: '/sprites/enemy/oidle.png',
    scale: 2.5,
    framesMax: 4,
    health: 100,
    offset: {
        x: 215,
        y: 65
    },
    sprites: {
        idle: {
            imgSrc: '/sprites/enemy/idle.png',
            framesMax: 4
        },
        run: {
            imgSrc: '/sprites/enemy/run.png',
            framesMax: 7
        },
        jump: {
            imgSrc: '/sprites/enemy/jump.png',
            framesMax: 3
        },
        fall: {
            imgSrc: '/sprites/enemy/fall.png',
            framesMax: 3
        },
        attack1: {
            imgSrc: '/sprites/enemy/attack1.png',
            framesMax: 4
        },
        attack2: {
            imgSrc: '/sprites/enemy/attack2.png',
            framesMax: 4
        },
        takeHit: {
            imgSrc: '/sprites/enemy/takeHit.png',
            framesMax: 2
        },
        death: {
            imgSrc: '/sprites/enemy/death.png',
            framesMax: 6
        }
    },
    attackBox: {
        offset: {
            x: -170,
            y: 50
        },
        width: 110,
        height: 50
    }
});
const {position, velocity, color, offset, health, imgSrc, framesMax} = enemy;
console.log("Enemy framesMax:", imgSrc)
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
    // Clear the canvas and draw the background
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Display story text
    c.fillStyle = 'white';
    c.font = '18px Arial';
    const lines = gameStory.split('\n'); // Split the story into lines for readability
    let y = canvas.height / 4; // Starting y-position for the text

    lines.forEach((line) => {
        c.fillText(line, canvas.width / 2 - c.measureText(line).width / 2, y);
        y += 30; // Adjust spacing between lines
    });
}


// Game over screen display

function gameOverScreen() {
    // Stop the music and hide the background on game over
    gamemusic.pause();
    gamemusic.currentTime=0
    showBackground = false;
    
    // Clear the canvas
    c.clearRect(0, 0, canvas.width, canvas.height);
    
    // Display game over message
    if (player.health <= 0) {
        displayMessage("Defeated by Steel..Brotherly love turns to ash.Glory lost.Press 'R' to Reclaim", 'red');
    } else {
        displayMessage("Victory but at what cost,Brother Fallen. Glory Empty.Press 'R' to Restart", 'green');
    }
}
function resetGame() {
    // Reset player
    player.position = { x: 50, y: groundLevel - 150 }
    player.velocity = { x: 0, y: 0 }
    player.health = 100
    player.dead = false
    player.switchSprite('idle')

    // Reset enemy
    enemy.position = { x: 700, y: groundLevel - 150 }
    enemy.velocity = { x: 0, y: 0 }
    enemy.health = 100
    enemy.dead = false
    enemy.switchSprite('idle')

    // Reset game state
    gameOver = false
    gameStarted = true
    showBackground = true
    
    // Reset music
    gamemusic.currentTime = 0
    gamemusic.play()

    // Restart animation
    if (window.animationFrameId) {
        cancelAnimationFrame(window.animationFrameId)
    }
    animate()
}



// Main game loop
function animate() {
    if (!gameStarted) return;
    if (gamemusic.paused) {
        gamemusic.play();
    }
    

    window.animationFrameId = window.requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);
    
    c.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    
    drawHealthBars();

    player.update();
    enemy.update();

    // Player movement handling
    player.velocity.x = 0;
    if (keys.d.pressed) {
        player.velocity.x = 3;
        player.switchSprite('run');
    }
    if (keys.a.pressed) {
        player.velocity.x = -3;
        player.switchSprite('run');
    }

    // Improved attack collision detection
    // Improved attack collision detection for player
if (
    (player.isAttacking || player.isSpecialAttacking) &&
    rectangularCollision({
        rectangle1: {
            position: player.attackBox.position,
            width: player.attackBox.width,
            height: player.attackBox.height
        },
        rectangle2: {
            position: enemy.position,
            width: enemy.width,
            height: enemy.height
        }
    }) &&
    player.attackBox.active  // Ensure attack box is actively engaged
) {
    if (player.currentAttack === 'special') {
        enemy.takeDamage(20);
    } else {
        enemy.takeDamage(10);
    }
    player.isAttacking = false;
    player.isSpecialAttacking = false;
    player.currentAttack = null;
}

// Similar improved collision detection for enemy
if (
    (enemy.isAttacking || enemy.isSpecialAttacking) &&
    rectangularCollision({
        rectangle1: {
            position: enemy.attackBox.position,
            width: enemy.attackBox.width,
            height: enemy.attackBox.height
        },
        rectangle2: {
            position: player.position,
            width: player.width,
            height: player.height
        }
    }) &&
    enemy.attackBox.active  // Ensure attack box is actively engaged
) {
    if (enemy.currentAttack === 'special') {
        player.takeDamage(20);
    } else {
        player.takeDamage(10);
    }
    enemy.isAttacking = false;
    enemy.isSpecialAttacking = false;
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