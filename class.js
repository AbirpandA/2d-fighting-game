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
            width: attackBox.width || 170,
            height: attackBox.height || 50
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
        this.attackCooldown = 500
        this.specialCooldown = 1500
        this.canAttack = true
        this.canSpecialAttack = true
        this.sprites = sprites
        this.dead = false
        
        this.currentSprite = 'idle'
        this.animationFrame = 0
        this.animationTimer = 0
        
        for (const sprite in this.sprites) {
            sprites[sprite].image = new Image()
            sprites[sprite].image.src = sprites[sprite].imgSrc
        }
    }

    attack() {
        if (this.stunned || !this.canAttack) return
        
        this.isAttacking = true
        this.currentAttack = 'normal'
        this.canAttack = false
        this.switchSprite('attack1')
        
        setTimeout(() => {
            this.isAttacking = false
            this.currentAttack = null
        }, 100)

        setTimeout(() => {
            this.canAttack = true
        }, this.attackCooldown)
    }

    specialAttack() {
        if (this.stunned || !this.canSpecialAttack) return
        
        this.isSpecialAttacking = true
        this.currentAttack = 'special'
        this.canSpecialAttack = false
        this.switchSprite('attack2')
        
        setTimeout(() => {
            this.isSpecialAttacking = false
            this.currentAttack = null
        }, 150)

        setTimeout(() => {
            this.canSpecialAttack = true
        }, this.specialCooldown)
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
            this.updatePosition()
            this.updateAttackBox()
            this.updateAnimation()
            if (this === enemy) {
                this.performAIAction(player)
            }
        }
        this.draw()
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
        if (this === enemy) {
            // Enemy faces left when player is on the left
            const facing = this.position.x > player.position.x ? -1 : 1
            this.attackBox.position.x = this.position.x + (facing === 1 ? this.attackBox.offset.x : -this.attackBox.width - this.attackBox.offset.x)
        } else {
            // Original player logic
            const facing = this.velocity.x >= 0 ? 1 : -1
            this.attackBox.position.x = this.position.x + (facing === 1 ? this.attackBox.offset.x : -this.attackBox.width - this.attackBox.offset.x)
        }
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y
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
        if (this === enemy && !this.dead) {
            const distanceToPlayer = Math.abs(this.position.x - player.position.x)
            const isPlayerInRange = distanceToPlayer < 200
            
            if (!this.isAttacking && !this.stunned) {
                if (distanceToPlayer > 150) {
                    this.velocity.x = this.position.x > player.position.x ? -3 : 3
                    this.switchSprite('run')
                } else if (distanceToPlayer < 100) {
                    this.velocity.x = this.position.x > player.position.x ? 3 : -3
                    this.switchSprite('run')
                } else {
                    this.velocity.x = 0
                    this.switchSprite('idle')
                }
            }

            if (isPlayerInRange && !this.isAttacking && !this.stunned) {
                if (Math.random() < 0.03) {
                    if (Math.random() < 0.7) {
                        this.attack()
                    } else {
                        this.specialAttack()
                    }
                }
            }
        }
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