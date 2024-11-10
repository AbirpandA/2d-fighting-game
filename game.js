// Get the canvas element and the 2D context for drawing
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');
const gravity = 0.5; // Increased gravity for faster fall
let lastkey;

// Fill the canvas with black to differentiate the game area from the background
c.fillStyle = 'black';
c.fillRect(0, 0, canvas.width, canvas.height);

const keys = {
    a: {
        pressed: false,
    },
    d: {
        pressed: false,
    },
    w: {
        pressed: false,
    },
};

// Add a grounded flag to check if the player is on the ground
let isGrounded = true;

// Define a Sprite class to represent objects in the game (e.g., player, enemy)
class Sprite {
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.height = 150;
        this.hasJumped = false; // Add a hasJumped flag
    }

    draw() {
        c.fillStyle = 'red'; // Set the color to red
        c.fillRect(this.position.x, this.position.y, 50, this.height); // Draw a rectangle
    }

    update() {
        this.draw(); // Redraw the sprite
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y; // Change the y-position based on the velocity
        
        if (this.height + this.position.y + this.velocity.y >= canvas.height) {
            this.velocity.y = 0;
            this.position.y = canvas.height - this.height; // Prevent the player from falling below the ground
            isGrounded = true; // The player is grounded
            this.hasJumped = false; // Reset the hasJumped flag when grounded
        } else {
            this.velocity.y += gravity;
            isGrounded = false; // The player is not grounded if falling
        }
    }
}

// Create the player object
const player = new Sprite({
    position: { x: 0, y: 0 }, // Starting position of the player
    velocity: { x: 0, y: 1 }, // Moving down with a speed of 2 pixels per frame
});

// Create the enemy object
const enemy = new Sprite({
    position: { x: 400, y: 100 }, // Starting position of the enemy
    velocity: { x: 0, y: 1 }, // Moving down with a speed of 1 pixel per frame
});

// Define the animation loop
function animate() {
    window.requestAnimationFrame(animate); // Request the next frame for the animation

    // Clear the canvas by filling it with black
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw the player and enemy objects
    player.update();
    enemy.update();

    // Update the player's horizontal velocity based on key presses
    if (keys.d.pressed && lastkey === 'd') {
        player.velocity.x = 1;
    } else if (keys.a.pressed && lastkey === 'a') {
        player.velocity.x = -1;
    } else {
        player.velocity.x = 0;
    }

    // Allow the player to jump only if they are grounded and hasn't jumped yet
    if (keys.w.pressed && isGrounded && !player.hasJumped) {
        player.velocity.y = -20; // Adjusted jump value for smoother jump
        isGrounded = false; // Prevent further jumps until grounded again
        player.hasJumped = true; // Set the hasJumped flag to true after jumping
    }
}

// Start the animation loop
animate();

// Event listener for keydown to start movement
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = true;
            lastkey = 'd';
            break;
        case 'a':
            keys.a.pressed = true;
            lastkey = 'a';
            break;
        case 'w':
            keys.w.pressed = true;
            break;
    }
});

// Event listener for keyup to stop movement
window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = false;
            break;
        case 'a':
            keys.a.pressed = false;
            break;
        case 'w':
            keys.w.pressed = false;
            break;
    }
});
