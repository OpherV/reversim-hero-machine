import { Math as PhaserMath } from 'phaser';
import Container from 'phaser/src/gameobjects/container/Container.js';
import shapes from '../assets/shapes.json';

export default class Bug extends Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {Object} config
     * @param {number} [config.speed=0.5] - Movement speed in px/frame
     * @param {number} [config.stopChance=0.005] - Probability per frame to stop
     * @param {number} [config.reverseChance=0.003] - Probability per frame to reverse direction
     * @param {number} [config.moveChance=0.01] - Probability per frame to resume moving
     * @param {number} [config.width=40]
     * @param {number} [config.height=24]
     * @param {number} [config.jiggleInterval=2000] - Time (ms) between jiggles when upside down
     * @param {number} [config.jiggleStrength=0.2] - Angular impulse strength for jiggling
     */
    constructor(scene, x, y, config = {}) {
        super(scene, x, y);
        this.scene = scene;

        this.width = config.width || 40;
        this.height = config.height || 24;
        this.speed = config.speed !== undefined ? config.speed : 0.5;
        this.stopChance = config.stopChance !== undefined ? config.stopChance : 0.005;
        this.reverseChance = config.reverseChance !== undefined ? config.reverseChance : 0.003;
        this.moveChance = config.moveChance !== undefined ? config.moveChance : 0.01;
        this.jiggleInterval = config.jiggleInterval !== undefined ? config.jiggleInterval : 2000;
        this.jiggleStrength = config.jiggleStrength !== undefined ? config.jiggleStrength : 0.8;

        this.direction = 1; // 1: right, -1: left
        this.moving = true;
        this.lastJiggleTime = 0; // Track when the last jiggle occurred

        // Create Matter.js body and sprite
        this.bodySprite = scene.matter.add.sprite(x, y, 'bug', null, {
            label: 'bug',
            shape: shapes.bug,
            friction: 0.1,
            frictionAir: 0.01, // Lowered for faster falling
            restitution: 0.1,
            isStatic: false
        });
        this.bodySprite.setDepth(200);

        // Sync container position to body
        this.bodySprite.setOnCollide(() => {}); // Ensure body is active

        // For flipping
        this.bodySprite.setFlipX(false);

        // Ensure parent Bug is destroyed if bodySprite is destroyed directly
        this.bodySprite.on('destroy', () => {
            if (!this._destroyed) {
                this.destroy();
            }
        });

        // Add to update list
        scene.events.on('update', this.update, this);
    }

    isUpsideDown() {
        if (!this.bodySprite) return false;
        const wrappedRot = PhaserMath.Angle.Wrap(this.bodySprite.rotation);
        return !(wrappedRot > -Math.PI/2 && wrappedRot < Math.PI/2);
    }

    update() {
        if (!this.bodySprite || !this.bodySprite.body) return;
        
        // Handle upside down state
        if (this.isUpsideDown()) {
            if (this.isGrounded()) {
                this.bodySprite.setVelocityX(0);
                this.moving = false; // Reset moving state when upside down and grounded
                
                // Jiggle occasionally when upside down and grounded
                const now = this.scene.time.now;
                if (now - this.lastJiggleTime > this.jiggleInterval) {
                    // Apply a small angular velocity for a subtle jiggle
                    this.bodySprite.setAngularVelocity(
                        (Math.random() - 0.5) * this.jiggleStrength
                    );
                    this.lastJiggleTime = now;
                }
            }
            return;
        }

        // Randomly decide to stop, move, or reverse
        if (this.moving) {
            if (Math.random() < this.stopChance) {
                this.moving = false;
            } else if (Math.random() < this.reverseChance) {
                this.direction *= -1;
                this.bodySprite.setFlipX(this.direction === -1);
            }
        } else {
            if (Math.random() < this.moveChance) {
                this.moving = true;
            }
        }

        // Only move if grounded
        if (this.moving && this.isGrounded()) {
            this.bodySprite.setVelocityX(this.speed * this.direction);
            this.bodySprite.setFlipX(this.direction === -1);
        } else if (this.isGrounded()) {
            this.bodySprite.setVelocityX(0);
        }

        // Sync container position to body
        this.x = this.bodySprite.x;
        this.y = this.bodySprite.y;
    }

    isGrounded() {
        // Fallback: consider grounded if vertical velocity is near zero
        if (this.bodySprite.body && this.bodySprite.body.velocity) {
            return Math.abs(this.bodySprite.body.velocity.y) < 1e-2 || this.grounded;
        }
        return this.grounded;
    }

    /**
     * Optionally update bug config at runtime
     */
    setConfig(config = {}) {
        if (config.speed !== undefined) this.speed = config.speed;
        if (config.stopChance !== undefined) this.stopChance = config.stopChance;
        if (config.reverseChance !== undefined) this.reverseChance = config.reverseChance;
        if (config.moveChance !== undefined) this.moveChance = config.moveChance;
    }

    destroy(fromScene) {
        if (this.scene) {
            this.scene.events.off('update', this.update, this);
        }
        // Remove this bug from the scene's children list
        if (this.scene && this.scene.children && this.scene.children.list) {
            const idx = this.scene.children.list.indexOf(this);
            if (idx !== -1) {
                this.scene.children.list.splice(idx, 1);
            }
        }
        this.active = false;
        this._destroyed = true;
        super.destroy(fromScene);
    }
}