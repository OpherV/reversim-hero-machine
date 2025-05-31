import { Math as PhaserMath } from 'phaser';
import Container from 'phaser/src/gameobjects/container/Container.js';
import { Geom as PhaserGeom } from 'phaser';
import { addCollisionHandler} from "../logic/collisionManager.js";

export default class Bugjar extends Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {Object} config
     * @param {number} [config.width=64] - Width of the bugjar
     * @param {number} [config.height=80] - Height of the bugjar
     * @param {number} [config.maxHits=4] - Number of hits before breaking
     */
    constructor(scene, x, y, config = {}) {
        super(scene, x, y);
        this.scene = scene;

        this.width = config.width || 64;
        this.height = config.height || 80;
        this.maxHits = config.maxHits || 4;
        this.hits = 0;
        this.isBroken = false;
        this.shudderDuration = 100; // ms for shudder effect
        this.shudderIntensity = 2; // pixels to move during shudder
        this.shuddering = false;
        this.lastHitTime = 0;
        this.hitCooldown = 1000; // 1 second cooldown between hits

        // Create Matter.js body and sprite
        this.bodySprite = scene.matter.add.sprite(x, y, 'bugjar_1', null, {
            label: 'bugjar',
            shape: {
                type: 'rectangle',
                width: this.width,
                height: this.height
            },
            friction: 0.1,
            frictionAir: 0.01,
            restitution: 0.1,
            isStatic: false
        });
        this.bodySprite.setDepth(200);

        // Remove persistent emitter pattern. We'll emit particles ad-hoc, like Computer.js
        // Debug: emit glass shards every 2 seconds
        // this.scene.time.addEvent({
        //     delay: 2000,
        //     callback: () => this.createGlassShards(8),
        //     callbackScope: this,
        //     loop: true
        // });

        // Set up collision handling
        this.setupCollisionHandlers();

        // Add to update list
        scene.events.on('update', this.update, this);
    }


    setupCollisionHandlers() {
        // Add collision handler for when other objects hit the bugjar
        addCollisionHandler({
            firstValidator: 'bugjar',
            secondValidator: (body) => !['paddle', 'bug'].includes(body.label),
            collisionstart: (bugjarBody, otherBody) => {
                if (!this.isBroken) {
                    this.onHit();
                }
            }
        });
    }

    onHit() {
        const now = this.scene.time.now;
        // Debounce: only allow hit if cooldown passed
        if (this.isBroken || (now - this.lastHitTime < this.hitCooldown)) {
            return;
        }
        this.lastHitTime = now;
        this.hits++;
        // Update sprite based on hit count
        const spriteFrame = Math.min(this.hits + 1, 5); // Cap at bugjar_5
        this.bodySprite.setTexture(`bugjar_${spriteFrame}`);
        // Emit shards on each hit (4-15 particles based on damage)
        const minShards = 4;
        const maxShards = 15;
        const shardCount = PhaserMath.Clamp(
            minShards + Math.floor((this.hits / this.maxHits) * (maxShards - minShards)),
            minShards,
            maxShards
        );
        this.createGlassShards(shardCount);
        // Shudder effect
        if (!this.shuddering) {
            this.shuddering = true;
            const originalX = this.bodySprite.x;
            const originalY = this.bodySprite.y;
            // Shake left and right with more intensity as it gets more damaged
            const intensity = this.shudderIntensity * (0.8 + (this.hits / this.maxHits) * 0.5);
            this.scene.tweens.add({
                targets: this.bodySprite,
                x: originalX + intensity,
                duration: this.shudderDuration / 4,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    this.shuddering = false;
                }
            });
        }
        // Check if bugjar should break
        if (this.hits >= this.maxHits) {
            this.break();
        }
    }

    break() {
        if (this.isBroken) return;
        this.isBroken = true;
        this.bodySprite.setTexture('bugjar_5');
        this.createGlassShards(12);
        this.emit('broken'); // Emit event
    }


    update() {
        if (!this.bodySprite || !this.bodySprite.body) return;
        // Sync container position to body
        this.x = this.bodySprite.x;
        this.y = this.bodySprite.y;
    }

    createGlassShards(count = 4) {
        // Ensure count is within 4-15 range
        count = PhaserMath.Clamp(count, 4, 15);
        const damageRatio = this.hits / this.maxHits;
        const shardTextures = ['shard_1', 'shard_2', 'shard_3'];
        const textureKey = shardTextures[Math.floor(Math.random() * shardTextures.length)];
        // Create a new particle effect each time, like Computer.js
        const particles = this.scene.add.particles(0, 0, textureKey, {
            speed: { min: 200 + (damageRatio * 60), max: 500 + (damageRatio * 100) },
            angle: { min: 180, max: 360 },
            scale: { start: (0.3 + (damageRatio * 0.15)) * 0.5, end: 0.1 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            gravityY: 1000,
            blendMode: 'NORMAL',
            frequency: 9999999, // Prevent auto-emission
            emitZone: {
                type: 'edge',
                source: new PhaserGeom.Circle(0, 0, 30 + (damageRatio * 3)),
                quantity: 1,
                yoyo: false
            },
            rotate: { min: 0, max: 360 }
        });
        particles.setDepth(201);
        particles.emitParticleAt(this.bodySprite.x, this.bodySprite.y, count);
        // Clean up after the effect is done
        this.scene.time.delayedCall(1100, () => {
            if (particles) {
                particles.destroy();
            }
        });
    }

    destroy(fromScene) {
        if (this.scene) {
            this.scene.events.off('update', this.update, this);
            this.scene.matter.world.off('collisionstart');
        }
        if (this.bodySprite) {
            this.bodySprite.destroy();
        }
        super.destroy(fromScene);
        this.emit('destroyed'); // Emit event
    }
}
