import { Display, GameObjects} from 'phaser';

/**
 * Label - A rounded rectangle with screws and centered text.
 *
 * Params:
 *   scene: Phaser.Scene
 *   x: number (center x)
 *   y: number (center y)
 *   width: number
 *   height: number
 *   radius: number
 *   backgroundColor: number (hex)
 *   screwColor: number (hex)
 *   text: string
 *   textColor: number (hex)
 *   fontSize: number
 */
export default class Label extends GameObjects.Container {
  constructor(scene, x, y, {
    width = 170,
    height = 28,
    radius = 14,
    backgroundColor = 0x536a96,
    screwColor = 0x7fa6a3,
    text = 'Label',
    textColor = 0xffffff,
    fontSize = 18,
    fontFamily = 'Montserrat',
  } = {}) {
    super(scene, x, y);
    this.width = width;
    this.height = height;
    this.radius = radius;

    // Draw rounded rectangle
    const rect = scene.add.graphics();
    rect.fillStyle(backgroundColor, 1);
    rect.fillRoundedRect(-width/2, -height/2, width, height, radius);
    this.add(rect);

    // Draw screws (left & right)
    const screwRadius = Math.min(height, width) * 0.13;
    const screwOffsetX = width/2 - screwRadius - 12;
    const screwY = 0;
    [ -1, 1 ].forEach(dir => {
      const screw = scene.add.graphics();
      screw.fillStyle(screwColor, 1);
      screw.fillCircle(dir * screwOffsetX, screwY, screwRadius);
      // Add a line for the screw slot
      screw.lineStyle(3, 0x2b4a4e, 1);
      screw.beginPath();
      screw.moveTo(dir * screwOffsetX - screwRadius/2, screwY - screwRadius/3);
      screw.lineTo(dir * screwOffsetX + screwRadius/2, screwY + screwRadius/3);
      screw.strokePath();
      this.add(screw);
    });

    // Add centered text
    const label = scene.add.text(0, 0, text, {
      fontFamily,
      fontSize: `${fontSize}px`,
      color: Display.Color.IntegerToColor(textColor).rgba,
      align: 'center',
    });
    label.setOrigin(0.5);


    this.setDepth(0);

    this.add(label);
  }
}


export function builder(phaserContext, group, itemConfig) {
  const phaserObject = new Label(phaserContext, itemConfig.x, itemConfig.y, {
    ...itemConfig.labelConfig
  });
  phaserContext.add.existing(phaserObject);

  return {
    phaserObject
  }
}
