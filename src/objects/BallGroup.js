import ballImg from '../images/ball.png';
import chuteBottomImg from '../images/chuteBottom.png';
import chuteTopImg from '../images/chuteTop.png';
import {Math as PhaserMath} from "phaser";
import {createGroupFromConfig} from "../logic/groupManager.js";

const ballGroupConfig = {
    "id": "ballGroup",
    "showHandle": true,
    "origin": {
        "x": 50,
        "y": 50
    },
    "objects": [
        {
            id: "paddle1",
            type: "paddle",
            x: 50,
            y: 150,
            w: 150,
            h: 10,
            angle: PhaserMath.DegToRad(30),
            userDraggable: true
        },
        {
            id: "paddle2",
            type: "paddle",
            x: 250,
            y: 250,
            w: 150,
            h: 10,
            angle: PhaserMath.DegToRad(-30),
            userDraggable: true
        },
        {
            id: "bottomChute",
            type: "sprite",
            sprite: "bottomChute",
            x: 50,
            y: -75,
            depth: 100
        },
        {
            id: "topChute",
            type: "sprite",
            sprite: "topChute",
            x: 50,
            y: -10,
            depth: 120
        },
        {
            type: "label",
            id: "ballLabel",
            x: 0,
            y: 230,
            labelConfig: {
                width: 120,
                text: "Commit"
            }
        }
    ]
}


let phaserContext;

export function loadAssets(context) {
    context.load.image('ball', ballImg);
    context.load.image('bottomChute', chuteBottomImg);
    context.load.image('topChute', chuteTopImg);
}

export function initBallGroup(context) {
    phaserContext = context;

    createGroupFromConfig(ballGroupConfig)

    phaserContext.time.addEvent({
        delay: 2500,
        callback: createBall,
        loop: true
    });
}

export function destroyBallGroup() {
    phaserContext = null;
}


function createBall() {
    const ball = phaserContext.matter.add.sprite(100, 50, 'ball', null, {
        label: 'ball',
        restitution: 0.9,
        friction: 0.002,
        circleRadius: 15,
    });
    ball.setDepth(110);
    ball.scale = 2/3;
    ball.body.userDraggable = true; // ugly hack
}

