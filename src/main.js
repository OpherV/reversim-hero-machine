import * as Phaser from "phaser";
import { initConveyorBelt } from "./ConveyorBelt.js";
import { initCoffee } from "./Coffee.js";
import { initPaddles} from "./Paddles.js";
import { initBookStack} from "./BookStack.js";
import { initUtils } from "./utils.js";
import { initComputer } from "./Computer.js";
import { initFan } from "./Fan.js";
import {getMachineObjectByBody, initGroupManager} from "./groupManager.js";
import { initDragManager } from "./dragManager.js";
import {drawCord, initCord, updateCord} from "./CoiledCord.js";

// Vite static asset imports (updated for Rollup/public directory structure)
import shapesJson from '../public/assets/shapes.json';
import ballImg from '../public/images/ball.png';

import coffeeCupImg from '../public/images/Cup.png';
import coffeeMachineImg from '../public/images/coffeeMachine.png';
import coffeeMachineCoverImg from '../public/images/coffeeMachineCover.png';

import computerImg from '../public/images/Computer.png';
import keyboardImg from '../public/images/Keyboard.png';
import paddleImg from '../public/images/paddle.png';

import coffeeParticleImg from '../public/images/coffeeParticle.png';
import fanBaseImg from '../public/images/fanBase.png';
import fanBladesImg from '../public/images/fanBlades.png';
import windMachineImg from '../public/images/windMachine.png';

import book1Img from '../public/images/book1.png';
import book2Img from '../public/images/book2.png';
import book3Img from '../public/images/book3.png';
import book4Img from '../public/images/book4.png';
import book5Img from '../public/images/book5.png';
import book6Img from '../public/images/book6.png';
import book7Img from '../public/images/book7.png';

import smoke1Img from '../public/images/smoke1.png';
import smoke2Img from '../public/images/smoke2.png';
import smoke3Img from '../public/images/smoke3.png';

let phaserContext;
let generalContext = {
    phaserContext: null,
}
let shapes;
let cordGraphics;
let game = null;

const objectRemovalDistance = 200;

function createBall() {
    const ball = phaserContext.matter.add.sprite(100, 50, 'ball', null, {
        restitution: 0.9,
        friction: 0.002,
        circleRadius: 15,
    });
    ball.scale = 2/3;
}

const createConfig = (domElement, options = {}) => {
    const { debug = false, width = 1100, height = 1100 } = options;
    
    return {
        type: Phaser.AUTO,
        width,
        height,
        transparent: true,
        parent: domElement,
        input: { mouse: { preventDefaultWheel: false } },
        physics: {
            default: "matter",
            matter: {
                ...(debug ? { debug: { showCollisions: false } } : {}),
            }
        },
        scene: {
            preload() {
                this.load.json('shapes', shapesJson);
                this.load.image('ball', ballImg);

                this.load.image('coffeeCup', coffeeCupImg);
                this.load.image('coffeeMachine', coffeeMachineImg);
                this.load.image('coffeeMachineCover', coffeeMachineCoverImg);

                this.load.image('computer', computerImg);
                this.load.image('keyboard', keyboardImg);
                this.load.image('paddle', paddleImg);

                this.load.image('coffeeParticle', coffeeParticleImg);
                this.load.image('fanBase', fanBaseImg);
                this.load.image('fanBlades', fanBladesImg);
                this.load.image('windMachine', windMachineImg);

                // Load book images
                this.load.image('book1', book1Img);
                this.load.image('book2', book2Img);
                this.load.image('book3', book3Img);
                this.load.image('book4', book4Img);
                this.load.image('book5', book5Img);
                this.load.image('book6', book6Img);
                this.load.image('book7', book7Img);

                this.load.image('smoke1', smoke1Img);
                this.load.image('smoke2', smoke2Img);
                this.load.image('smoke3', smoke3Img);
            },

            create() {
                phaserContext = generalContext.phaserContext =  this;
                phaserContext.matter.add.mouseSpring();

                shapes = this.cache.json.get('shapes');

                initGroupManager(generalContext, shapes);
                initUtils(generalContext);
                initDragManager(generalContext)

                initPaddles(phaserContext, shapes);
                initConveyorBelt(phaserContext)
                initCoffee(phaserContext, shapes)
                initBookStack(phaserContext);
                initComputer(generalContext);
                initFan(generalContext);

                // Initialize the coiled cord after computer
                initCord(phaserContext);

                // Create Phaser graphics for the cord
                cordGraphics = this.add.graphics();

                this.time.addEvent({
                    delay: 1500,
                    callback: createBall,
                    loop: true
                });
            },

            update() {
                const removalDist = objectRemovalDistance; // configurable
                const frameWidth = phaserContext.game.config.width;
                const frameHeight = phaserContext.game.config.height;
                updateCord();
                drawCord(cordGraphics);

                this.matter.world.engine.world.bodies.forEach((body) => {
                    const {x, y} = body.position;
                    // Calculate distance to nearest frame edge
                    const dx = Math.min(Math.abs(x), Math.abs(frameWidth - x));
                    const dy = Math.min(Math.abs(y), Math.abs(frameHeight - y));

                    // Remove bodies that are out of bounds by at least removalDist
                    if (
                        x < -removalDist || x > frameWidth + removalDist ||
                        y < -removalDist || y > frameHeight + removalDist
                    ) {
                        const machineObject = getMachineObjectByBody(body);
                        if (machineObject) {
                            machineObject.phaserObject.destroy();

                        } else {
                            // relevant for balls
                            body.gameObject.destroy();
                        }
                        phaserContext.matter.world.remove(body);
                    }
                });
            }
        }
    };
};

const ReversimMachine = {
    init(domRef, options = {}) {
        if (game) {
            game.destroy(true);
        }
        
        // If domRef is a string, treat it as a selector
        const domElement = typeof domRef === 'string' ? document.querySelector(domRef) : domRef;
        
        if (!domElement) {
            console.error('Invalid DOM reference provided to ReversimMachine.init');
            return;
        }
        
        const config = createConfig(domElement, options);
        game = new Phaser.Game(config);
        
        return game;
    },
    
    destroy() {
        if (game) {
            game.destroy(true);
            game = null;
        }
    }
};

export default ReversimMachine;
