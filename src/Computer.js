// Computer-related functionality
import { addStatic } from './utils.js';
import { createPaddle } from './Paddles.js';

let generalContext;
let phaserContext;
let shapes;
let computerSprite;
let smokeEmitter1;
let smokeEmitter2;
let smokeEmitter3;
let smokeConfig = {
    amount: 1,      // Controls emission rate
    thickness: 2,   // Controls particle size
    distance: 150,  // Controls how far particles travel
    speedX: 0.5,    // Controls the horizontal speed of smoke particles
    speedY: 1,    // Controls the vertical speed of smoke particles
    rotation: 2     // Controls how much the particles rotate
};

function setupComputer() {
    // Computer
    const computerGroup = {
        origin: {x: 665, y: 825},
        visible: true
    };

    createPaddle(149, 141, 300, 10, 0, { group: computerGroup });
    computerSprite = addStatic(227, 60, 140, 150, { group: computerGroup, sprite: "computer", shape: shapes.Computer });
    addStatic(48, 123, 100, 20, { group: computerGroup, sprite: "keyboard", shape: shapes.Keyboard }); // keyboard
}

export function initComputer(context, shapesData) {
    generalContext = context
    phaserContext = context.phaserContext;
    shapes = shapesData;

    setupComputer();
    startSmoke();
}

/**
 * Starts emitting smoke particles from the top of the computer
 * @param {Object} options - Configuration options for smoke
 * @param {number} options.amount - Amount of smoke particles (emission rate)
 * @param {number} options.thickness - Thickness of smoke particles (size)
 * @param {number} options.distance - Distance smoke particles travel
 * @param {number} options.speedX - Horizontal speed of smoke particles
 * @param {number} options.speedY - Vertical speed of smoke particles
 * @param {number} options.rotation - Amount of rotation for smoke particles
 */
export function startSmoke(options = {}) {
    // Apply options if provided, otherwise use defaults
    if (options.amount !== undefined) smokeConfig.amount = options.amount;
    if (options.thickness !== undefined) smokeConfig.thickness = options.thickness;
    if (options.distance !== undefined) smokeConfig.distance = options.distance;
    if (options.speedX !== undefined) smokeConfig.speedX = options.speedX;
    if (options.speedY !== undefined) smokeConfig.speedY = options.speedY;
    if (options.rotation !== undefined) smokeConfig.rotation = options.rotation;
    
    // If emitters already exist, destroy them first
    if (smokeEmitter1) {
        smokeEmitter1.stop();
        smokeEmitter1.destroy();
    }
    if (smokeEmitter2) {
        smokeEmitter2.stop();
        smokeEmitter2.destroy();
    }
    if (smokeEmitter3) {
        smokeEmitter3.stop();
        smokeEmitter3.destroy();
    }
    
    // Calculate emission point (top of computer)
    const emitX = computerSprite.x;
    const emitY = computerSprite.y - (computerSprite.height / 2);
    
    // Base speed values adjusted by speed parameters
    const baseMinSpeedX = 10 * smokeConfig.speedX;
    const baseMaxSpeedX = 20 * smokeConfig.speedX * smokeConfig.amount;
    
    // Vertical speed affects both the particle speed and gravity
    const baseMinSpeedY = 20 * smokeConfig.speedY;
    const baseMaxSpeedY = 40 * smokeConfig.speedY * smokeConfig.amount;
    
    // Create smoke1 emitter
    smokeEmitter1 = phaserContext.add.particles(emitX, emitY, 'smoke1', {
        speed: { min: baseMinSpeedY, max: baseMaxSpeedY },
        scale: { start: 0.1 * smokeConfig.thickness, end: 0.5 * smokeConfig.thickness },
        alpha: { start: 0.5, end: 0 },
        angle: { min: 260, max: 280 }, // Slightly randomized upward direction
        lifespan: { min: 2000, max: 3000 },
        frequency: 500 / smokeConfig.amount, // Particles per second (higher amount = more particles)
        quantity: 1,
        gravityY: -50 * smokeConfig.distance / 150 * smokeConfig.speedY, // Negative gravity to make particles float upward
        blendMode: 'NORMAL',
        tint: 0x999999, // Light gray tint
        emitCallback: (particle) => {
            // Set initial horizontal velocity based on speedX
            particle.velocityX = Math.sin(Date.now() / 1000) * 10 * smokeConfig.speedX;
            
            // Set initial rotation
            particle.rotation = Math.random() * Math.PI * 2;
            
            // Set continuous rotation speed as the particle drifts up
            particle.rotateSpeed = (Math.random() * 0.02 + 0.01) * smokeConfig.rotation;
        },
        update: (particle, delta) => {
            // Continuously rotate the particle
            particle.rotation += particle.rotateSpeed * delta / 16;
            
            // Add some slight horizontal movement variation over time
            particle.velocityX += Math.sin(particle.lifeTime / 300) * 0.05 * smokeConfig.speedX;
        }
    });
    
    // Create smoke2 emitter with slightly different parameters
    smokeEmitter2 = phaserContext.add.particles(emitX + 5, emitY - 2, 'smoke2', {
        speed: { min: baseMinSpeedY * 0.75, max: baseMaxSpeedY * 0.9 },
        scale: { start: 0.12 * smokeConfig.thickness, end: 0.55 * smokeConfig.thickness },
        alpha: { start: 0.4, end: 0 },
        angle: { min: 265, max: 275 },
        lifespan: { min: 2200, max: 3200 },
        frequency: 750 / smokeConfig.amount, // Less frequent than smoke1
        quantity: 1,
        gravityY: -45 * smokeConfig.distance / 150 * smokeConfig.speedY,
        blendMode: 'NORMAL',
        tint: 0x888888, // Medium gray tint
        emitCallback: (particle) => {
            // Different wave pattern for variety with horizontal speed
            particle.velocityX = Math.cos(Date.now() / 1200) * 8 * smokeConfig.speedX;
            
            // Set initial rotation in opposite direction
            particle.rotation = Math.random() * Math.PI * 2;
            
            // Set continuous rotation speed in opposite direction
            particle.rotateSpeed = (Math.random() * -0.03 - 0.01) * smokeConfig.rotation;
        },
        update: (particle, delta) => {
            // Continuously rotate the particle in opposite direction
            particle.rotation += particle.rotateSpeed * delta / 16;
            
            // Add some slight horizontal movement variation over time
            particle.velocityX += Math.cos(particle.lifeTime / 400) * 0.04 * smokeConfig.speedX;
        }
    });
    
    // Create smoke3 emitter with slightly different parameters
    smokeEmitter3 = phaserContext.add.particles(emitX - 5, emitY - 1, 'smoke3', {
        speed: { min: baseMinSpeedY * 0.9, max: baseMaxSpeedY * 0.85 },
        scale: { start: 0.08 * smokeConfig.thickness, end: 0.48 * smokeConfig.thickness },
        alpha: { start: 0.45, end: 0 },
        angle: { min: 262, max: 278 },
        lifespan: { min: 1800, max: 2800 },
        frequency: 900 / smokeConfig.amount, // Least frequent
        quantity: 1,
        gravityY: -55 * smokeConfig.distance / 150 * smokeConfig.speedY,
        blendMode: 'NORMAL',
        tint: 0x777777, // Darker gray tint
        emitCallback: (particle) => {
            // Third wave pattern for variety with horizontal speed
            particle.velocityX = Math.sin(Date.now() / 900) * 12 * smokeConfig.speedX;
            
            // Set initial rotation with more variation
            particle.rotation = Math.random() * Math.PI * 2;
            
            // Set continuous rotation with more variation and oscillation
            particle.rotateSpeed = (Math.random() * 0.04 + 0.02) * smokeConfig.rotation;
            particle.rotateDirection = 1; // Will be used to change direction periodically
            particle.rotateTimer = 0;     // Timer for direction changes
        },
        update: (particle, delta) => {
            // Periodically change rotation direction for more dynamic movement
            particle.rotateTimer += delta;
            if (particle.rotateTimer > 500) { // Change direction every 500ms
                particle.rotateDirection *= -1;
                particle.rotateTimer = 0;
            }
            
            // Continuously rotate the particle with direction changes
            particle.rotation += particle.rotateSpeed * particle.rotateDirection * delta / 16;
            
            // Add some slight horizontal movement variation over time with speedX
            particle.velocityX += Math.sin(particle.lifeTime / 250) * 0.06 * smokeConfig.speedX;
        }
    });
    
    return [smokeEmitter1, smokeEmitter2, smokeEmitter3];
}

/**
 * Stops the smoke emission
 */
export function stopSmoke() {
    if (smokeEmitter1) smokeEmitter1.stop();
    if (smokeEmitter2) smokeEmitter2.stop();
    if (smokeEmitter3) smokeEmitter3.stop();
}

/**
 * Updates smoke parameters
 * @param {Object} options - Configuration options for smoke
 * @param {number} options.amount - Amount of smoke particles (emission rate)
 * @param {number} options.thickness - Thickness of smoke particles (size)
 * @param {number} options.distance - Distance smoke particles travel
 * @param {number} options.speedX - Horizontal speed of smoke particles
 * @param {number} options.speedY - Vertical speed of smoke particles
 * @param {number} options.rotation - Amount of rotation for smoke particles
 */
export function updateSmokeParams(options = {}) {
    if (options.amount !== undefined) smokeConfig.amount = options.amount;
    if (options.thickness !== undefined) smokeConfig.thickness = options.thickness;
    if (options.distance !== undefined) smokeConfig.distance = options.distance;
    if (options.speedX !== undefined) smokeConfig.speedX = options.speedX;
    if (options.speedY !== undefined) smokeConfig.speedY = options.speedY;
    if (options.rotation !== undefined) smokeConfig.rotation = options.rotation;
    
    // Restart the emitter with new parameters if it exists
    if (smokeEmitter1 || smokeEmitter2 || smokeEmitter3) {
        startSmoke(smokeConfig);
    }
}
