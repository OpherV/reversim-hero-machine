import Phaser from "phaser";
import { initConveyorBelt } from "./ConveyorBelt.js";
import { initCoffee } from "./Coffee.js";
import { initPaddles} from "./Paddles.js";
import { initBookStack} from "./BookStack.js";
import { initUtils } from "./utils.js";
import { initComputer } from "./Computer.js";
import { initFan } from "./Fan.js";
import {getMachineObjectByBody, getMachineObjectById, initGroupManager} from "./groupManager.js";
import { initDragManager } from "./dragManager.js";
import {drawCord, initCord, updateCord} from "./CoiledCord.js";

const debug = true;

let phaserContext;
let generalContext = {
    phaserContext: null,
}
let shapes;
let cordGraphics;

const objectRemovalDistance = 200;

function createBall() {
    const ball = phaserContext.matter.add.sprite(100, 50, 'ball', null, {
        restitution: 0.9,
        friction: 0.002,
        circleRadius: 15,
    });
    ball.scale = 2/3;
}



const config = {
    type: Phaser.AUTO,
    width: 1100,
    height: 1100,
    transparent: true,
    physics: {
        default: "matter",
        matter: {
            ...(debug ? { debug: { showCollisions: false } } : {}),
        }
    },
    scene: {
        preload() {
            this.load.json('shapes', 'assets/shapes.json');
            this.load.image('ball', '/images/ball.png');

            this.load.image('coffeeCup', '/images/Cup.png');
            this.load.image('coffeeMachine', '/images/coffeeMachine.png');
            this.load.image('coffeeMachineCover', '/images/coffeeMachineCover.png');

            this.load.image('computer', '/images/Computer.png');
            this.load.image('keyboard', '/images/Keyboard.png');
            this.load.image('paddle', '/images/paddle.png');

            this.load.image('coffeeParticle', '/images/coffeeParticle.png');
            this.load.image('fanBase', '/images/fanBase.png');
            this.load.image('fanBlades', '/images/fanBlades.png');
            this.load.image('windMachine', '/images/windMachine.png');

            // Load book images
            this.load.image('book1', '/images/book1.png');
            this.load.image('book2', '/images/book2.png');
            this.load.image('book3', '/images/book3.png');
            this.load.image('book4', '/images/book4.png');
            this.load.image('book5', '/images/book5.png');
            this.load.image('book6', '/images/book6.png');
            this.load.image('book7', '/images/book7.png');

            this.load.image('smoke1', '/images/smoke1.png');
            this.load.image('smoke2', '/images/smoke2.png');
            this.load.image('smoke3', '/images/smoke3.png');
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

new Phaser.Game(config);
