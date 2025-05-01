import { createPaddle } from './Paddles.js';

let phaserContext;
let shapes;

function createBook(x, y, w, h) {
    const book = phaserContext.matter.add.rectangle(x, y, w, h, {
        label: 'book',
    });
}

function createBookStack(stackOrigin) {
    // Create the base paddle for the book stack
    createPaddle(stackOrigin.x, stackOrigin.y, 150, 10, 0);
    
    // Stack books on the paddle
    [
        [0, 100, 15],
        [20, 100, 15],
        [-10, 100, 20],
        [10, 100, 30],
        [14, 100, 10],
        [20, 100, 20],
        [40, 100, 15],
    ].reduce((prevY, [xOffset, bookWidth, bookHeight]) => {
        const x = stackOrigin.x + xOffset;
        const y = prevY - (bookHeight / 2);
        createBook(x, y, bookWidth, bookHeight);
        return y - (bookHeight / 2);
    }, stackOrigin.y - 5); // should use paddle height
}

export function initBookStack(context, shapesData) {
    phaserContext = context;
    shapes = shapesData;
    
    // Create the book stack at the specified position
    const stackOrigin = {x: 540, y: 850};
    createBookStack(stackOrigin);
}
