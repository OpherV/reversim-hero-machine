import { Math as PhaserMath } from "phaser";
import {addObjectBuilder, createGroupFromConfig, getMachineObjectById} from "../logic/groupManager.js";
import Bug from './Bug.js'
import Bugjar from './Bugjar.js'

import bugImage from '../images/bugjar/bug.png';
import bugjarImage1 from '../images/bugjar/bugjar_1.png';
import bugjarImage2 from '../images/bugjar/bugjar_2.png';
import bugjarImage3 from '../images/bugjar/bugjar_3.png';
import bugjarImage4 from '../images/bugjar/bugjar_4.png';
import bugjarImage5 from '../images/bugjar/bugjar_5.png';

import shardImage1 from '../images/bugjar/shard_1.png';
import shardImage2 from '../images/bugjar/shard_2.png';
import shardImage3 from '../images/bugjar/shard_3.png';




const bugjarGroupConfig = {
    "id": "bugjarGroup",
    "showHandle": true,
    "origin": {
        "x": 511.32616021140433,
        "y": 42.849497267005404
    },
    "objects": [
        {
            "type": "paddle",
            "id": "bugjarBase",
            "x": 149,
            "y": 141,
            "w": 400,
            "h": 10
        },
        {
            "type": "bugjar",
            "id": "bugjar",
            "x": 250,
            "y": 100
        }
    ]
}

let phaserContext;
let bugSpawnTimer = null;

export function initBugjarGroup(context){
    phaserContext = context;

    addObjectBuilder('bugjar', (phaserContext, group, itemConfig) => {
        const bugjar = new Bugjar(phaserContext, itemConfig.x, itemConfig.y);
        phaserContext.add.existing(bugjar);

        // Listen for events to manage bug spawning
        bugjar.on('broken', () => {
            if (!bugSpawnTimer) {
                bugSpawnTimer = phaserContext.time.addEvent({
                    // delay should be random between 3 and 6 seconds
                    delay: PhaserMath.Between(3000, 6000),
                    loop: true,
                    callback: () => {
                        const bugs = phaserContext.children.list.filter(obj =>
                            obj?.bodySprite?.texture?.key === 'bug' &&
                            obj.active !== false &&
                            !obj._destroyed
                        );
                        const bugCount = bugs.length;
                        if (bugCount >= 5) return;
                        const bugX = bugjar.x - 60;
                        const bugY = bugjar.y + 20;
                        let bug = new Bug(phaserContext, bugX, bugY, { direction: -1 });
                        bug.direction = -1;
                        bug.bodySprite.setFlipX(true);
                        phaserContext.add.existing(bug);
                    }
                });
            }
        });
        bugjar.on('destroyed', () => {
            if (bugSpawnTimer) {
                bugSpawnTimer.remove(false);
                bugSpawnTimer = null;
            }
        });

        return {
            phaserObject: bugjar,
            body: bugjar.body
        }
    })
    createGroupFromConfig(bugjarGroupConfig);
}

export function loadAssets(phaserContext){
    phaserContext.load.image('bug', bugImage);

    phaserContext.load.image('bugjar_1', bugjarImage1);
    phaserContext.load.image('bugjar_2', bugjarImage2);
    phaserContext.load.image('bugjar_3', bugjarImage3);
    phaserContext.load.image('bugjar_4', bugjarImage4);
    phaserContext.load.image('bugjar_5', bugjarImage5);

    phaserContext.load.image('shard_1', shardImage1);
    phaserContext.load.image('shard_2', shardImage2);
    phaserContext.load.image('shard_3', shardImage3);

}