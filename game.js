// Get the canvas element and context for drawing
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');

// Define gravity to simulate jumping and falling
const gravity = 0.5;
let lastKey;

// Set up keys for player control tracking
const keys = {
    a: { pressed: false },
    d: { pressed: false },
    w: { pressed: false },
};

// Sprite class represents the player and enemy characters
class Sprite {
    constructor({ position, velocity, color = 'red', offset, health = 100 }) {
        this.position = position;
        this.velocity = velocity;
        this.height = 150;
        this.width = 50;
        this.color = color;
        this.attackbox = {
            position: { x: this.position.x, y: this.position.y },
            offset,
            width: 100,
            height: 50,
        };
        this.isAttacking = false;
        this.isSpecialAttacking = false;
        this.health = health;
        this.currentAttack = null;
    }

    // Draw the sprite and its attack box if attacking
    draw() {
        c.fillStyle = this.color;
        c.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Draw attack box if attacking
        if (this.isAttacking) {
            c.fillStyle = 'yellow';
            c.fillRect(this.attackbox.position.x, this.attackbox.position.y, this.attackbox.width, this.attackbox.height);
        } else if (this.isSpecialAttacking) {
            c.fillStyle = 'orange';
            c.fillRect(this.attackbox.position.x, this.attackbox.position.y, this.attackbox.width * 1.5, this.attackbox.height);
        }
    }

    // Update position and apply gravity if not grounded
    update() {
        this.draw();
        this.attackbox.position.x = this.position.x + this.attackbox.offset.x;
        this.attackbox.position.y = this.position.y;

        // Apply velocity to position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Apply gravity if above the ground
        if (this.position.y + this.height + this.velocity.y >= canvas.height) {
            this.velocity.y = 0;
            this.position.y = canvas.height - this.height;
        } else {
            this.velocity.y += gravity;
        }
    }

    // Methods to trigger different types of attacks
    attack() {
        this.isAttacking = true;
        this.currentAttack = 'normal';
        setTimeout(() => {
            this.isAttacking = false;
            this.currentAttack = null;
        }, 120);
    }

    specialAttack() {
        this.isSpecialAttacking = true;
        this.currentAttack = 'special';
        setTimeout(() => {
            this.isSpecialAttacking = false;
            this.currentAttack = null;
        }, 120);
    }

    // Take damage method, reducing health
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }

    // Simple AI behavior: decide between normal or special attack, or move toward player
    performAIAction(player) {
        const random = Math.random();

        if (random < 0.01) {
            this.attack();
        } else if (random < 0.005) {
            this.specialAttack();
        } else if (player.position.x > this.position.x) {
            this.velocity.x = 0.5;
        } else {
            this.velocity.x = -0.5;
        }
    }
}

// Create player and enemy with starting positions, colors, and offsets
const player = new Sprite({
    position: { x: 50, y: 0 },
    velocity: { x: 0, y: 0 },
    color: 'red',
    offset: { x: 0, y: 0 },
    health: 100,
});

const enemy = new Sprite({
    position: { x: 700, y: 0 },
    velocity: { x: 0, y: 0 },
    color: 'blue',
    offset: { x: -50, y: 0 },
    health: 100,
});

// Draw health bars at the top of the canvas, with a "VS" divider
function drawHealthBars() {
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, 30);

    // Draw player health bar on the left
    c.fillStyle = 'red';
    c.fillRect(10, 5, (canvas.width / 2 - 20) * (player.health / 100), 20);

    // Draw enemy health bar on the right
    c.fillStyle = 'blue';
    c.fillRect(canvas.width / 2 + 10, 5, (canvas.width / 2 - 20) * (enemy.health / 100), 20);

    // Draw "VS" label in center
    c.fillStyle = 'black';
    c.fillRect(canvas.width / 2 - 15, 0, 30, 30);
    c.fillStyle = 'white';
    c.font = '20px Arial';
    c.fillText('VS', canvas.width / 2 - 12, 22);
}

// Animation loop updates player and enemy states, and redraws canvas each frame
function animate() {
    window.requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    drawHealthBars(); // Draw health bars at top

    player.update();
    enemy.update();

    // Player movement handling
    if (keys.d.pressed) player.velocity.x = 1;
    else if (keys.a.pressed) player.velocity.x = -1;
    else player.velocity.x = 0;

    // Check for player attacking enemy and apply damage
    if (
        player.currentAttack &&
        player.attackbox.position.x + player.attackbox.width >= enemy.position.x &&
        player.attackbox.position.x <= enemy.position.x + enemy.width
    ) {
        enemy.takeDamage(player.currentAttack === 'special' ? 20 : 10);
        player.currentAttack = null; // Reset attack state
    }

    // Enemy AI action based on player position
    enemy.performAIAction(player);
}

// Start the animation loop
animate();

// Keydown event listener for player movement and attacks
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = true;
            break;
        case 'a':
            keys.a.pressed = true;
            break;
        case 'w':
            if (player.velocity.y === 0) player.velocity.y = -15; // Jump if on the ground
            break;
        case ' ':
            player.attack();
            break;
        case 'Shift':
            player.specialAttack();
            break;
    }
});

// Keyup event listener for stopping movement when keys are released
window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = false;
            break;
        case 'a':
            keys.a.pressed = false;
            break;
    }
});
