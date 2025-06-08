import { Game, Scale, AUTO } from "phaser";
import { getFrameWidth, initRender } from "./logic/render.js";
import { destroyCollisionManager, initCollisionManager} from "./logic/collisionManager.js";
import { initDragManager } from "./logic/dragManager.js";
import { initConveyorBelt } from "./objects/ConveyorBelt.js";
import { initCoffee } from "./objects/Coffee.js";
import { initPaddles} from "./objects/Paddles.js";
import { initBookStack} from "./objects/BookStack.js";
import { initUtils } from "./logic/utils.js";
import { initComputer, loadAssets as loadComputerAssets } from "./objects/Computer.js";
import { initFan } from "./objects/Fan.js";
import { destroyGroupManager, getMachineObjectByBody, initGroupManager} from "./logic/groupManager.js";
import { drawCord, initCord, updateCord} from "./objects/CoiledCord.js";
import { initRobot} from "./objects/Robot.js";
import { initBugjarGroup, loadAssets as loadBugjarAssets} from "./objects/BugjarGroup.js";
import { initBallGroup, destroyBallGroup, loadAssets as loadBallAssets } from "./objects/BallGroup.js";

// Vite static asset imports (updated for Rollup/public directory structure)
import shapesJson from './assets/shapes.json';

import coffeeCupImg from './images/Cup.png';
import coffeeMachineImg from './images/coffeeMachine.png';
import coffeeMachineCoverImg from './images/coffeeMachineCover.png';

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

import robotBase from './images/robotBase.png';
import robotHead from './images/robotHead.png';
import robotArm from './images/robotArm.png';
import pincer1 from './images/pincer1.png';
import pincer2 from './images/pincer2.png';

let phaserContext;
let generalContext = {
    phaserContext: null,
}
let shapes;
let cordGraphics;
let game = null;

const objectRemovalDistance = 200;

const createConfig = (domElement, options = {}) => {
    const canvasBB = domElement.getBoundingClientRect();

    return {
        type: AUTO,
        width: canvasBB.width,
        height: canvasBB.height,
        transparent: true,
        parent: domElement,
        input: { mouse: { preventDefaultWheel: false } },
        physics: {
            default: "matter",
            matter: {
                ...(options.debug ? { debug: { showCollisions: false } } : {}),
            }
        },
        scale: {
          width: canvasBB.width,
          height: canvasBB.height,
          mode: Scale.RESIZE,
        },
        scene: {
            preload() {
                this.load.json('shapes', shapesJson);

                this.load.image('coffeeCup', coffeeCupImg);
                this.load.image('coffeeMachine', coffeeMachineImg);
                this.load.image('coffeeMachineCover', coffeeMachineCoverImg);

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

                this.load.image('robotBase', robotBase);
                this.load.image('robotHead', robotHead);
                this.load.image('robotArm', robotArm);
                this.load.image('pincer1', pincer1);
                this.load.image('pincer2', pincer2);

                loadBallAssets(this);
                loadComputerAssets(this);
                loadBugjarAssets(this);
            },

            create() {
                phaserContext = generalContext.phaserContext =  this;
                initRender(phaserContext, domElement ,options);

                phaserContext.matter.add.mouseSpring();

                shapes = this.cache.json.get('shapes');

                initGroupManager(generalContext, shapes);
                initUtils(generalContext);
                initDragManager(generalContext)
                initCollisionManager(phaserContext)

                initPaddles(phaserContext, shapes);
                initConveyorBelt(phaserContext)
                initCoffee(phaserContext, shapes)
                initBookStack(phaserContext);
                initComputer(generalContext);
                initFan(generalContext, options.onAirMachineStart);

                initCord(phaserContext);
                // todo fix this in the initCord
                cordGraphics = this.add.graphics();

                initRobot(phaserContext);
                initBugjarGroup(phaserContext);
                initBallGroup(phaserContext);
            },

            update(time, delta) {
                const removalDist = objectRemovalDistance; // configurable
                const frame = getFrameWidth()
                updateCord();
                drawCord(cordGraphics);

                this.matter.world.engine.world.bodies.forEach((body) => {
                    const {x, y} = body.position;

                    // todo fix top/left bounds
                    // Remove bodies that are out of bounds by at least removalDist
                    if (
                        x < -frame.width -removalDist || x > frame.width + removalDist ||
                        y < -frame.height -removalDist || y > frame.height + removalDist
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
    /**
     * Initialize the Reversim Machine
     * @param {HTMLElement|string} domRef - DOM element or selector
     * @param {Object} options - Options for the machine
     * @param {Function} [options.onAirMachineStart] - Called when fan reaches max rotation
     */
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

            destroyBallGroup();
            destroyGroupManager();
            destroyCollisionManager();
        }
    }
};

export default ReversimMachine;
