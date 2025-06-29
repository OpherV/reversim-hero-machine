import { createPaddle } from './Paddles.js';
import { attachToPhysics } from '../logic/utils.js';
import {addObjectBuilder, createGroupFromConfig, getMachineObjectById} from "../logic/groupManager.js";

let phaserContext;

const bookConfig = {
    "id": "bookGroup",
    "origin": {
        "x": 400,
        "y": 910
    },
    "showHandle": true,
    "objects": [
        {
            "type": "paddle",
            "id": "bookBase",
            "x": 150,
            "y": 10,
            "w": 200,
            "h": 10,
            "userDraggable": true,
        },
        {
            "type": "book",
            "id": "book6",
            "order": 6,
            "x": 115.625,
            "y": -194.875,
            "width": 125,
            "height": 20,
            "bookType": 5,
            "title": "Stack Overflow",
            "userDraggable": true,
        },
        {
            "type": "book",
            "id": "book5",
            "order": 5,
            "x": 142.875,
            "y": -160.5,
            "width": 124,
            "height": 33,
            "bookType": 3,
            "title": "The Docs",
            "userDraggable": true,
        },
        {
            "type": "book",
            "id": "book4",
            "order": 4,
            "x": 164.5,
            "y": -131.625,
            "width": 125,
            "height": 12,
            "bookType": 1,
            "title": "Edge Cases",
            "userDraggable": true,
        },
        {
            "type": "book",
            "id": "book3",
            "order": 3,
            "x": 164,
            "y": -102.75,
            "width": 112,
            "height": 33,
            "bookType": 2,
            "title": "404",
            "userDraggable": true,
        },
        {
            "type": "book",
            "id": "book2",
            "order": 2,
            "x": 145,
            "y": -65.625,
            "width": 125,
            "height": 26,
            "bookType": 4,
            "title": "Git Happens",
            "userDraggable": true,
        },
        {
            "type": "book",
            "id": "book1",
            "order": 1,
            "x": 172.875,
            "y": -38.125,
            "width": 124,
            "height": 19,
            "bookType": 7,
            "title": "Man / Woman Pages",
            "userDraggable": true,
        },
        {
            "type": "book",
            "id": "book0",
            "order": 0,
            "x": 145.375,
            "y": -12,
            "width": 125,
            "height": 20,
            "bookType": 6,
            "title": "Clean-ish Code",
            "userDraggable": true,
        },
        {
            type: "label",
            id: "bookLabel",
            x: -40,
            y: -30,
            labelConfig: {
                width: 140,
                text: "Document"
            }
        }
    ]
}

function createBook(x, y, width, height, type, title) {
    // Use the appropriate book sprite based on type (1-7)
    const spriteKey = `book${type}`;

    // Create the book as a sprite
    const book = phaserContext.matter.add.sprite(x, y, spriteKey, null, {
        label: 'book',
        shape: {
            type: 'rectangle',
            width: width,
            height: height
        },
        // mass: Infinity,
        // inertia: Infinity,
        // isStatic: true,
    });

    // Scale the sprite to match the desired width and height
    // book.displayWidth = width;
    // book.displayHeight = height;
    book.scale = 1.4
    // Add text to the middle of the book
    if (title) {
        const textStyle = {
            font: '18px Montserrat',
            fill: '#FFFFFF',
            align: 'center',
        };

        const text = phaserContext.add.text(x, y, title, textStyle);
        text.setOrigin(0.5, 0.5); // Center the text
        text.setDepth(book.depth + 100);

        // Attach the text to the book physics body
        attachToPhysics(book, text, { matchRotation: true });
    }

    return {
        body: book.body,
        phaserObject: book
    }
}

export function initBookStack(context) {
    phaserContext = context;

    addObjectBuilder('book', (phaserContext, group, itemConfig) => {

        const book = createBook(
            itemConfig.x,
            itemConfig.y,
            itemConfig.width,
            itemConfig.height,
            itemConfig.bookType,
            itemConfig.title
        );

        return book
    });

    createGroupFromConfig(bookConfig);
    // Create the book stack at the specified position
    // const stackOrigin = {x: 550, y: 850};
    // createBookStack(bookConfig);
}
