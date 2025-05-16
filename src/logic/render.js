let phaserContext;
let domElement;
let phaserOptions;
let canvasBB;
let zoom;


export function initRender(context, _domElement, options = {}) {
    domElement = _domElement;
    phaserOptions = options;
    phaserContext = context;
    updateRender();

    // Add ResizeObserver to update render on size change
    if (typeof ResizeObserver !== 'undefined') {
        if (initRender._resizeObserver) {
            initRender._resizeObserver.disconnect();
        }
        initRender._resizeObserver = new ResizeObserver(() => {
            canvasBB = domElement.getBoundingClientRect();
            updateRender();
        });
        initRender._resizeObserver.observe(domElement);
    }
}


export function updateRender(){
    canvasBB = domElement.getBoundingClientRect();
    const canvasEl = domElement.querySelector("canvas");
    // canvasEl.setAttribute("width", canvasBB.width);
    // canvasEl.setAttribute("height", canvasBB.height);
    const {
        frameTopLeft = {x:0,y:0},
        frameBottomRight = {x:1000,y:1000},
        browserTargetBoundingBox } = phaserOptions;

    const frameWidth = frameBottomRight.x - frameTopLeft.x;
    const frameHeight = frameBottomRight.y - frameTopLeft.y;


    let btBoxBB = null;
    if (browserTargetBoundingBox) {
        const btBox = (typeof browserTargetBoundingBox === 'string') ? document.querySelector(browserTargetBoundingBox) : browserTargetBoundingBox;
        if (btBox) {
            btBoxBB = btBox.getBoundingClientRect();
        }
    } else {
        btBoxBB = canvasBB
    }

    const zoomX = btBoxBB.width / frameWidth;
    const zoomY = btBoxBB.height / frameHeight;
    zoom = Math.min(zoomX, zoomY);


    // CAMERA FIT: Fit frameTopLeft/frameBottomRight to gameworldBoundingBox area within canvas
    const cam = phaserContext.cameras.main;

    cam.setZoom(zoom);
    const resetXOffset = canvasBB.width * (1 - zoom) / (2 * zoom)
    const resetYOffset = canvasBB.height * (1 - zoom) / (2 * zoom)

    // set to top left, then move to
    cam.setScroll(
        resetXOffset - (btBoxBB.left - canvasBB.left) / zoom,
        resetYOffset - (btBoxBB.top - canvasBB.top) / zoom
    );

    // 693 =  (300 - 25) / 0.4
    // 693 = (btBox.left - canvasBb.left) / zoom

    // console.log(bboxWidth, bboxHeight);
    // console.log(finalWidth / zoom);
    // cam.setBounds(0, 0, width, height);
    // cam.setSize(finalWidth / zoom, finalHeight / zoom)

    // cyan = finalWidth * zoom * 2
    // all canvas in game world = cyan / 0.4
    // (all canvas in game world - cyan) / 2

    // (cyan / 0.4 - cyan) / 2
    // cyan( 0.4 - 1) /2
    // cyan ( zoom - 1) / 2
    // finalWidth * zoom * 2  * ( zoom - 1) /2
    // 2 * (finalWidth * zoom * (zoom -1))
    // 2 * (1466 * 0.4 ( 0.4 - 1))


    // reset to 0
    // x_offset = finalWidth * (1 - zoom) / (2 * zoom)







    // const graphics = this.add.graphics();
    // graphics.fillStyle(0x00ffff, 0.4);
    // graphics.fillRect(0, 0,
    //     finalWidth,
    //     finalHeight);
    //
    // graphics.fillStyle(0xff0000, 0.2);
    //
    // graphics.fillRect(frameTopLeft.x, frameTopLeft.y,
    //     frameBottomRight.x - frameTopLeft.x,
    //     frameBottomRight.y - frameTopLeft.y);
    //
}

export function getFrameWidth() {
    return {
        width: canvasBB.width / zoom,
        height: canvasBB.height / zoom
    }
}