
class Sprite {
    constructor({
      position,
      imgSrc="",
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
class fighter extends Sprite {
    constructor({ position, velocity, color = 'red', offset, health = 100,imageSrc,
        scale = 1,
        framesMax = 1 }) {
        super(
        position,
        imageSrc,
        scale,
        framesMax
        )
        // Basic character properties
        this.position = position;
        this.velocity = velocity;
        this.height = 150;
        this.width = 50;
        this.color = color;
        this.framesCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 5
        
        // Attack hitbox configuration
         this.attackbox = {
            position: { x: this.position.x, y: this.position.y },
            offset,
            width: 100,
            height: 50
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
        this.specialCooldown = 1500;   // Special attack cooldown in milliseconds
        this.canAttack = true;         // Flag to track if player can attack
        this.canSpecialAttack = true;  // Flag to track if player can special attack
    }

    

    // Modified attack method with cooldown
    attack() {
        if (this.stunned || !this.canAttack) return;
        
        this.isAttacking = true;
        this.currentAttack = 'normal';
        this.canAttack = false;
        
        const originalAttackWidth = this.attackbox.width;
        this.attackbox.width += 20; 
        // Reset attack state and cooldown
        setTimeout(() => {
            this.isAttacking = false;
            this.currentAttack = null;
            this.attackbox.width = originalAttackWidth;
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
                } else if (Math.random() < 0.35) {
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

        if (this.position.y + this.height + this.velocity.y >= groundLevel) {
            this.velocity.y = 0;
            this.position.y = groundLevel - this.height; // Position at ground level
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