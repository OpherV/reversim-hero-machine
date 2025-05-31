import Container from 'phaser/src/gameobjects/container/Container.js';

export default class DashedLineGraphic extends Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {Object} config
     * @param {number} [config.lineLength=100] - Length of the dashed line
     * @param {number} [config.lineWidth=2] - Width of the dashed line
     * @param {number} [config.dashLength=10] - Length of each dash
     * @param {number} [config.gapLength=5] - Length of gap between dashes
     * @param {number} [config.lineColor=0x000000] - Color of the line (hex value)
     * @param {number} [config.circleRadius=5] - Radius of the end circle
     * @param {number} [config.circleColor=0x000000] - Color of the end circle (hex value)
     * @param {number} [config.alpha=1] - Alpha value for both line and circle (0-1)
     */
    constructor(scene, x, y, config = {}) {
        super(scene, x, y);
        this.scene = scene;
        
        // Default configuration
        this.config = {
            lineLength: 200,
            lineWidth: 6,
            dashLength: 12,
            gapLength: 14,
            lineColor: 0x1e2449,
            circleRadius: 18,
            circleColor: 0x000000,
            alpha: 1,
            ...config
        };

        // Create graphics object
        this.graphics = this.scene.add.graphics();
        this.add(this.graphics);

        // Draw the dashed line with circle
        this.redraw();

        // Add to scene
        scene.add.existing(this);
    }


    /**
     * Redraws the dashed line and circle with current configuration
     */
    redraw() {
        this.graphics.clear();
        
        const { 
            lineLength, 
            lineWidth, 
            dashLength, 
            gapLength, 
            lineColor, 
            circleRadius, 
            circleColor,
            alpha 
        } = this.config;

        // Set alpha for both line and circle
        this.graphics.setAlpha(alpha);

        // Draw dashed line
        this.graphics.lineStyle(lineWidth, lineColor);
        
        let y = 0;
        while (y < lineLength) {
            // Draw dash
            this.graphics.beginPath();
            this.graphics.moveTo(0, y);
            const dashEnd = Math.min(y + dashLength, lineLength);
            this.graphics.lineTo(0, dashEnd);
            this.graphics.strokePath();
            
            // Move to next dash position
            y += dashLength + gapLength;
        }

        // Draw circle at the end of the line
        this.graphics.fillStyle(circleColor);
        this.graphics.fillCircle(0, lineLength, circleRadius);
    }

    /**
     * Update configuration and redraw
     * @param {Object} newConfig - New configuration values to merge with existing
     */
    setConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
        this.redraw();
    }


    /**
     * Clean up when destroyed
     */
    destroy(fromScene) {
        if (this.graphics) {
            this.graphics.destroy();
        }
        super.destroy(fromScene);
    }
}

export function builder(phaserContext, group, itemConfig) {

    const dashedLineGraphic = new DashedLineGraphic(
        phaserContext,
        itemConfig.x,
        itemConfig.y,
        itemConfig.dashedLineConfig
    );
    phaserContext.add.existing(dashedLineGraphic);
    return {
        phaserObject: dashedLineGraphic
    }
}