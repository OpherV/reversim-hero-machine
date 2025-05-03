import { createPaddle } from './Paddles.js';
import { attachToPhysics } from './utils.js';

let phaserContext;
let shapes;

function createBook(x, y, width, height, type, title) {
    // Use the appropriate book sprite based on type (1-7)
    const spriteKey = `book${type}`;
    
    // Create the book as a sprite
    const book = phaserContext.matter.add.sprite(x, y, spriteKey, null, {
        label: 'book',
    });
    
    // Scale the sprite to match the desired width and height
    book.displayWidth = width;
    book.displayHeight = height;
    
    // Add text to the middle of the book
    if (title) {
        const textStyle = {
            font: '10px Montserrat',
            fill: '#FFFFFF',
            align: 'center',
            wordWrap: { width: width - 10 }
        };
        
        const text = phaserContext.add.text(x, y, title, textStyle);
        text.setOrigin(0.5, 0.5); // Center the text
        
        // Attach the text to the book physics body
        attachToPhysics(book, text, { matchRotation: true });
    }
    
    return book;
}

function createBookStack(stackOrigin) {
    // Create the base paddle for the book stack
    createPaddle(stackOrigin.x, stackOrigin.y, 150, 10, 0);
    
    // Stack books on the paddle with the new object-based configuration
    [
        { xOffset: 40, width: 100, height: 15, type: 5, title: "Stack Overflow" },
        { xOffset: 20, width: 100, height: 15, type: 3, title: "The Docs" },
        { xOffset: -10, width: 100, height: 20, type: 1, title: "Edge Cases" },
        { xOffset: 10, width: 100, height: 30, type: 2, title: "404" },
        { xOffset: 14, width: 100, height: 10, type: 4, title: "Git Happens" },
        { xOffset: 20, width: 100, height: 20, type: 7, title: "Man & Woman Pages" },
        { xOffset: 0, width: 100, height: 15, type: 6, title: "Clean-ish Code" },
    ].reverse().reduce((prevY, book) => {
        const x = stackOrigin.x + book.xOffset;
        const y = prevY - (book.height / 2);
        createBook(x, y, book.width, book.height, book.type, book.title);
        return y - (book.height / 2);
    }, stackOrigin.y - 5); // should use paddle height
}

export function initBookStack(context, shapesData) {
    phaserContext = context;
    shapes = shapesData;
    
    // Create the book stack at the specified position
    const stackOrigin = {x: 550, y: 850};
    createBookStack(stackOrigin);
}
