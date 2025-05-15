import { Game, AUTO } from "phaser";
import { initConveyorBelt } from "./objects/ConveyorBelt.js";
import { initCoffee } from "./objects/Coffee.js";
import { initPaddles} from "./objects/Paddles.js";
import { initBookStack} from "./objects/BookStack.js";
import { initUtils } from "./logic/utils.js";
import { initComputer } from "./objects/Computer.js";
import { initFan } from "./objects/Fan.js";
import {getMachineObjectByBody, initGroupManager} from "./logic/groupManager.js";
import { initDragManager } from "./logic/dragManager.js";
import {drawCord, initCord, updateCord} from "./objects/CoiledCord.js";

// Vite static asset imports (updated for Rollup/public directory structure)
import shapesJson from './assets/shapes.json';
import ballImg from './images/ball.png';

import coffeeCupImg from './images/Cup.png';
import coffeeMachineImg from './images/coffeeMachine.png';
import coffeeMachineCoverImg from './images/coffeeMachineCover.png';

import computerImg from './images/Computer.png';
import keyboardImg from './images/Keyboard.png';
import paddleImg from './images/paddle.png';

import coffeeParticleImg from './images/coffeeParticle.png';
import fanBaseImg from './images/fanBase.png';
import fanBladesImg from './images/fanBlades.png';
import windMachineImg from './images/windMachine.png';

import book1Img from './images/book1.png';
import book2Img from './images/book2.png';
import book3Img from './images/book3.png';
import book4Img from './images/book4.png';
import book5Img from './images/book5.png';
import book6Img from './images/book6.png';
import book7Img from './images/book7.png';

import smoke1Img from './images/smoke1.png';
import smoke2Img from './images/smoke2.png';
import smoke3Img from './images/smoke3.png';

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
    const bb = domElement.getBoundingClientRect();
    const { debug = false, width, height} = options;
    const finalWidth = bb.width ?? 1100;
    const finalHeight = bb.height ?? 1100;
    console.log(finalWidth, finalHeight)
    return {
        type: AUTO,
        width: finalWidth,
        height: finalHeight,
        transparent: true,
        parent: domElement,
        input: { mouse: { preventDefaultWheel: false } },
        physics: {
            default: "matter",
            matter: {
                ...(debug ? { debug: { showCollisions: false } } : {}),
            }
        },
        scale: {
          width: finalWidth,
           zoom: 0.6

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

                // this.cameras.main.setZoom(0.45);
                // this.cameras.main.setPosition(-300, -200);

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
        game = new Game(config);
        
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
