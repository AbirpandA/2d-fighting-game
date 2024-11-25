class Sprite {
    constructor({
        position,
        imgSrc,
        scale = 1,
        framesMax = 1,
        offset = { x: 0, y: 0 }
    }) {
        this.position = position
        this.width = 50
        this.height = 150
        this.image = new Image()
        this.image.src = imgSrc
        this.scale = scale
        this.framesMax = framesMax
        this.framesCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 5
        this.offset = offset
    }

    draw() {
        if (!this.image) return
        
        c.drawImage(
            this.image,
            this.framesCurrent * (this.image.width / this.framesMax),
            0,
            this.image.width / this.framesMax,
            this.image.height,
            this.position.x - this.offset.x,
            this.position.y - this.offset.y,
            (this.image.width / this.framesMax) * this.scale,
            this.image.height * this.scale
        )
        
    }

    animateFrames() {
        this.framesElapsed++

        if (this.framesElapsed % this.framesHold === 0) {
            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++
            } else {
                this.framesCurrent = 0
            }
        }
    }

    update() {
        this.draw()
        this.animateFrames()
    }
}


class Fighter extends Sprite {
    constructor({ 
        position, 
        velocity, 
        color = 'red', 
        imgSrc,
        scale = 1,
        framesMax = 1,
        health = 100,
        offset = { x: 0, y: 0 },
        sprites,
        attackBox = { offset: {}, width: undefined, height: undefined }
    }) {
        super({
            position,
            imgSrc,
            scale,
            framesMax,
            offset
        })

        this.velocity = velocity
        this.height = 150
        this.width = 50
        this.color = color
        
        this.attackBox = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            offset: attackBox.offset,
            width: attackBox.width || 100,
            height: attackBox.height || 50,
            active: false  // New property to track active attack state
        }
        
        this.isAttacking = false
        this.isSpecialAttacking = false
        this.health = health
        this.currentAttack = null
        this.hitTimer = 0
        this.stunned = false
        this.lastAttackTime = 0
        this.comboCount = 0
        this.recoveryTime = 0
        this.attackCooldown = 900
        this.specialCooldown = 1500
        this.canAttack = true
        this.canSpecialAttack = true
        this.sprites = sprites
        this.dead = false
        this.hasUsedAirAttack = false;
        
        this.currentSprite = 'idle'
        this.animationFrame = 0
        this.animationTimer = 0
        
        for (const sprite in this.sprites) {
            sprites[sprite].image = new Image()
            sprites[sprite].image.src = sprites[sprite].imgSrc
        }
    }

    attack() {
        // Check for ground attack
        if (this.velocity.y === 0) {
            if (this.stunned || !this.canAttack) return;
            
            this.isAttacking = true;
            this.currentAttack = 'normal';
            this.canAttack = false;
            this.attackBox.active = true;
            this.switchSprite('attack1');
            
            setTimeout(() => {
                this.isAttacking = false;
                this.currentAttack = null;
                this.attackBox.active = false;
            }, 100);
    
            setTimeout(() => {
                this.canAttack = true;
            }, this.attackCooldown);
        } 
        // Handle air attack
        else {
            // Only allow one air attack
            if (this.hasUsedAirAttack || this.stunned) return;
            
            this.isAttacking = true;
            this.currentAttack = 'airAttack';
            this.hasUsedAirAttack = true;
            this.attackBox.active = true;
            this.switchSprite('attack1'); // You might want a specific air attack sprite
            
            setTimeout(() => {
                this.isAttacking = false;
                this.currentAttack = null;
                this.attackBox.active = false;
            }, 100);
        }
    }

specialAttack() {
    // Similar ground-based constraints
    if (this.stunned || !this.canSpecialAttack || this.velocity.y !== 0) return;
    
    this.isSpecialAttacking = true;
    this.currentAttack = 'special';
    this.canSpecialAttack = false;
    this.attackBox.active = true;
    this.switchSprite('attack2');
    
    setTimeout(() => {
        this.isSpecialAttacking = false;
        this.currentAttack = null;
        this.attackBox.active = false;
    }, 150);

    setTimeout(() => {
        this.canSpecialAttack = true;
    }, this.specialCooldown);
}

    takeDamage(damage) {
        if (this.dead) return

        const comboDamage = damage * (1 + Math.min(this.comboCount * 0.1, 0.5))
        this.health -= comboDamage
        
        if (this.health <= 0) {
            this.health = 0
            this.switchSprite('death')
            this.dead = true
        } else {
            this.switchSprite('takeHit')
        }
        
        this.hitTimer = 10
        this.stunned = true
        this.recoveryTime = 20
        this.velocity.x = 0
    }

    animateFrames() {
        this.framesElapsed++

        // Adjust animation speed based on action
        let frameHoldValue = 5 // default speed

        if (this.image === this.sprites.jump?.image) {
            frameHoldValue = 8 // slower jump animation
        } else if (this.image === this.sprites.fall?.image) {
            frameHoldValue = 8 // slower fall animation
        } else if (
            this.image === this.sprites.attack1?.image || 
            this.image === this.sprites.attack2?.image
        ) {
            frameHoldValue = 7 // slightly slower attack animations
        }

        this.framesHold = frameHoldValue

        if (this.framesElapsed % this.framesHold === 0) {
            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++
            } else {
                this.framesCurrent = 0
            }
        }
    }

    update() {
        if (!this.dead) {
            this.updatePosition();
            this.updateAttackBox();
            this.updateAnimation();
            
            // Reset air attack when touching the ground
            if (this.position.y + this.height >= groundLevel) {
                this.hasUsedAirAttack = false;
            }
            
            if (this === enemy) {
                this.performAIAction(player);
            }
        }
        this.draw();
    }

    updatePosition() {
        const nextX = this.position.x + this.velocity.x
        if (nextX >= 0 && nextX <= canvas.width - this.width) {
            this.position.x = nextX
        }
        
        this.position.y += this.velocity.y

        if (this.position.y + this.height + this.velocity.y >= groundLevel) {
            this.velocity.y = 0
            this.position.y = groundLevel - this.height
        } else {
            this.velocity.y += gravity
        }

        if (this.hitTimer > 0) this.hitTimer -= 0.1
        if (this.recoveryTime > 0) {
            this.recoveryTime--
            if (this.recoveryTime <= 0) {
                this.stunned = false
            }
        }
    }

    updateAttackBox() {
    // Determine direction based on player/enemy
    const isEnemy = this === enemy;
    const spriteWidth = this.image.width / this.framesMax;
    
    // Dynamic attack box sizing based on current sprite and attack type
    let attackBoxWidth = 100;
    let attackBoxHeight = 50;
    
    // Adjust attack box for different animations
    if (this.currentSprite === 'attack1' || this.currentSprite === 'attack2') {
        // Different sizing for ground and air attacks
        if (this.velocity.y !== 0) {
            // Air attack specific sizing
            attackBoxWidth = spriteWidth * 1.2;
            attackBoxHeight = this.height * 0.4;
        } else {
            // Ground attack sizing
            attackBoxWidth = spriteWidth * 1.5;
            attackBoxHeight = this.height * 0.6;
        }
    }
    
    // Positioning logic with explicit offset management
    if (isEnemy) {
        // Enemy attack box (facing left)
        this.attackBox.position.x = this.position.x - attackBoxWidth + this.attackBox.offset.x;
    } else {
        // Player attack box (facing right)
        this.attackBox.position.x = this.position.x + this.width + this.attackBox.offset.x;
    }
    
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y;
    this.attackBox.width = attackBoxWidth;
    this.attackBox.height = attackBoxHeight;
}
    updateAnimation() {
        this.animateFrames()

        if (this.velocity.y < 0) {
            this.switchSprite('jump')
        } else if (this.velocity.y > 0) {
            this.switchSprite('fall')
        } else if (this.velocity.x !== 0) {
            this.switchSprite('run')
        } else if (!this.isAttacking && !this.isSpecialAttacking && !this.stunned) {
            this.switchSprite('idle')
        }
    }

  performAIAction(player) {
    class AIBehaviorManager {
        constructor(enemy, player) {
            this.enemy = enemy;
            this.player = player;
            this.strategyChangeInterval = 0;
            this.currentStrategy = null;
            this.strategies = [
                'aggressive',
                'defensive',
                'evasive',
                'balanced'
            ];
        }

        calculateDistanceToPlayer() {
            return Math.abs(this.player.position.x - this.enemy.position.x);
        }

        determineStrategy() {
            this.strategyChangeInterval++;

            if (this.strategyChangeInterval > 180) {
                this.currentStrategy = this.strategies[
                    Math.floor(Math.random() * this.strategies.length)
                ];
                this.strategyChangeInterval = 0;
            }

            return this.currentStrategy;
        }

      moveIntelligently() {
    const distance = this.calculateDistanceToPlayer();
    const facingRight = this.player.position.x > this.enemy.position.x;
    const playerAttackBox = this.player.attackBox;
    const playerAttackRange = playerAttackBox.position.x + playerAttackBox.width; // Right edge of player's attack box
    const enemyAttackBox = this.enemy.attackBox;
    const enemyAttackRange = this.enemy.position.x; // Left edge of enemy's attack box

    // Optimal engagement distance
    const minEngageDistance = 150;
    const maxEngageDistance = 300;

    // Always face the player
    const moveDirection = facingRight ? 1 : -1;

    // Check if the enemy is within the player's attack range
    if (facingRight && enemyAttackRange < playerAttackRange) {
        // Move towards the player until reaching the attack range
        this.enemy.velocity.x = 4 * moveDirection;
    } else if (!facingRight && enemyAttackRange > playerAttackRange) {
        // Move towards the player until reaching the attack range
        this.enemy.velocity.x = -4 * moveDirection;
    } else {
        // If within attack range, stop moving
        this.enemy.velocity.x = 0;
    }

    // Additional engagement logic
    if (distance > maxEngageDistance) {
        // Chase aggressively when too far
        this.enemy.velocity.x = 4 * moveDirection;
    } else if (distance < minEngageDistance) {
        // Slight repositioning when too close
        this.enemy.velocity.x = -2 * moveDirection;
    } else {
        // If within engage distance but not attacking, slow down
        this.enemy.velocity.x *= 0.5; // Slow down to prevent overshooting
    }

    // Edge case handling to prevent getting stuck
    if (this.enemy.position.x <= 0 || this.enemy.position.x >= canvas.width - this.enemy.width) {
        this.enemy.velocity.x *= -1; // Reverse direction if hitting the edge
    }
}

decideAttack() {
    const distance = this.calculateDistanceToPlayer();
    const playerHealth = this.player.health;
    const enemyHealth = this.enemy.health;

    // More aggressive attack conditions
    const shouldSpecialAttack = 
        distance < 250 &&  // Increased range for special attack
        (
            playerHealth / enemyHealth > 1.5 ||  // When player is significantly healthier
            playerHealth < 30 ||  // When player's health is low
            Math.random() < 0.3   // Increased chance of special attack
        );

    const shouldNormalAttack = 
        distance < 300 &&  // Wider attack range
        Math.random() < 0.6;  // Increased attack frequency (60% chance)

    // Combo potential: If last attack was successful, increase aggression
    const recentlyHitPlayer = this.enemy.lastAttackTime > 0;

    // Add more dynamic attack decision
    if (!this.enemy.stunned && !this.enemy.recoveryTime) {
        if (shouldSpecialAttack && this.enemy.canSpecialAttack) {
            this.enemy.specialAttack();
        } 
        
        // If special attack fails, immediately follow up with normal attack
        else if (shouldNormalAttack && this.enemy.canAttack) {
            // Increased likelihood of consecutive attacks
            if (recentlyHitPlayer || Math.random() < 0.4) {
                this.enemy.attack();
            }
        }
    }
}

        performDefensiveMoves() {
            if (this.player.isAttacking && Math.random() < 0.3) {
                this.enemy.velocity.y = -8;  // Quick jump
                this.enemy.velocity.x *= -1.8;  // Reverse direction
            }

            if (this.enemy.position.x <= 50 || this.enemy.position.x >= canvas.width - 100) {
                this.enemy.velocity.x *= -1.5;
            }
        }
    }

    // Initialize and execute advanced AI
    const aiBehavior = new AIBehaviorManager(this, player);
    
    // Skip AI if stunned or recovering
    if (this.stunned || this.recoveryTime > 0) {
        this.recoveryTime--;
        this.velocity.x = 0;
        return;
    }

    // Core AI Decision Loop
    const strategy = aiBehavior.determineStrategy();
    aiBehavior.moveIntelligently();
    aiBehavior.decideAttack();
    aiBehavior.performDefensiveMoves();

    // Velocity clamping
    const maxVelocity = 2;
    this.velocity.x = Math.max(Math.min(this.velocity.x, maxVelocity), -maxVelocity);
}
    
    switchSprite(sprite) {
        if (this.dead) return
        
        if (
            this.image === this.sprites.attack1?.image &&
            this.framesCurrent < this.sprites.attack1.framesMax - 1
        ) return
        
        if (
            this.image === this.sprites.attack2?.image &&
            this.framesCurrent < this.sprites.attack2.framesMax - 1
        ) return
        
        if (
            this.image === this.sprites.takeHit?.image &&
            this.framesCurrent < this.sprites.takeHit.framesMax - 1
        ) return

        if (this.sprites[sprite] && this.image !== this.sprites[sprite].image) {
            this.image = this.sprites[sprite].image
            this.framesMax = this.sprites[sprite].framesMax
            this.framesCurrent = 0
        }
    }
}
function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.position.x < rectangle2.position.x + rectangle2.width &&
        rectangle1.position.x + rectangle1.width > rectangle2.position.x &&
        rectangle1.position.y < rectangle2.position.y + rectangle2.height &&
        rectangle1.position.y + rectangle1.height > rectangle2.position.y
    );
}

