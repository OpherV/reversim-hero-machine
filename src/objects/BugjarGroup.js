import {createGroupFromConfig, getMachineObjectById} from "../logic/groupManager.js";
import Bug from './Bug.js'
import bugImage from '../images/bug.png';


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
        }
    ]
}

let phaserContext;

export function initBugjarGroup(context){
    phaserContext = context;

    let bug1 = new Bug(phaserContext, 500, 100);
    phaserContext.add.existing(bug1);

    createGroupFromConfig(bugjarGroupConfig);

}

export function loadAssets(phaserContext){
    phaserContext.load.image('bug', bugImage);
}