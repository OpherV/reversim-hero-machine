import { Math as PhaserMath } from 'phaser';
import Container from 'phaser/src/gameobjects/container/Container.js';

// --- SPRITE OFFSETS (tweak as needed) ---
const SPRITE_OFFSETS = {
    base:   { x: 0,   y: -23.5,   angle: 0 },
    boom:   { x: 0,   y: 0,   angle: Math.PI/2 },
    head:   { x: 0,   y: 0,   angle: -Math.PI/2 },
    pincerLeft:  { x: 0,   y: 0,   angle: Math.PI/2 },
    pincerRight: { x: 0,   y: 0,   angle: Math.PI/2 },
};


export default class RobotArm extends Container {
    constructor(scene, x, y, options = {}) {
        super(scene, x, y);
        this.scene = scene;
        this.baseX = x;
        this.baseY = y;
        // Arm dimensions (can be tweaked)
        this.boomLength = options.boomLength || 120;
        this.headLength = options.headLength || 55;
        this.pincerLength = options.pincerLength || 32;
        this.pincerWidth = options.pincerWidth || 12;
        this.pincerMinDist = options.pincerMinDist || 16;
        this.pincerMaxDist = options.pincerMaxDist || 60;
        this.headJointOffset = options.headJointOffset || 5; // how far back from boom end the head attaches
        this.headJointLocalOffset = options.headJointLocalOffset || 20; // how far from head's rear the joint is
        this.pincerDistanceFromHead = options.pincerDistanceFromHead || 18; // how far in front of the head the pincers are
        this.currentTween = null;
        this.currentPincerTween = null;
        // Physics group
        this.matter = scene.matter;
        // Create bodies
        this._createBodies();
        // Create sprites
        this._createSprites();
        // Add to scene
        scene.add.existing(this);
    }

    _createBodies() {
        // Base (invisible, just anchor)
        this.base = this.matter.add.rectangle(this.baseX, this.baseY, 30, 30, {isStatic: true, label: 'robot-base'});
        // Boom arm
        this.boom = this.matter.add.rectangle(this.baseX + this.boomLength/2, this.baseY, this.boomLength, 20, {isStatic: true, label: 'robot-boom'});
        // Head: center is offset so that the pivot (joint) is at the correct location
        // The pivot is at (boom end - headJointOffset), so head center is further ahead by (headLength/2 - headJointLocalOffset)
        const headJointX = this.baseX + this.boomLength - this.headJointOffset;
        const headCenterX = headJointX + (this.headLength/2 - this.headJointLocalOffset);
        this.head = this.matter.add.rectangle(headCenterX, this.baseY, this.headLength, 18, {isStatic: true, label: 'robot-head'});
        // Pincers (left/right, at a controllable distance in front of head)
        const pincerBaseX = headCenterX + (this.headLength/2) - this.headJointLocalOffset + this.pincerDistanceFromHead;
        this.pincerLeft = this.matter.add.rectangle(pincerBaseX, this.baseY - this.pincerMinDist/2, this.pincerLength, this.pincerWidth, {isStatic: true, label: 'robot-pincer-left'});
        this.pincerRight = this.matter.add.rectangle(pincerBaseX, this.baseY + this.pincerMinDist/2, this.pincerLength, this.pincerWidth, {isStatic: true, label: 'robot-pincer-right'});
        // Store for easy access
        this.bodies = [this.base, this.boom, this.head, this.pincerLeft, this.pincerRight];
    }

    _createSprites() {
        // Sprites using loaded images
        this.robotArmSprite = this.scene.add.sprite(0, 0, 'robotArm').setOrigin(0.5);
        this.robotBaseSprite = this.scene.add.sprite(0, 0, 'robotBase').setOrigin(0.5);
        this.robotHeadSprite = this.scene.add.sprite(0, 0, 'robotHead').setOrigin(0.5);
        this.pincer1Sprite = this.scene.add.sprite(0, 0, 'pincer2').setOrigin(0.5);
        this.pincer2Sprite = this.scene.add.sprite(0, 0, 'pincer1').setOrigin(0.5);

        this.robotArmSprite.scaleY = 1.8;
        // Add to this container
        this.add([
            this.robotArmSprite,
            this.robotBaseSprite,
            this.robotHeadSprite,
            this.pincer1Sprite,
            this.pincer2Sprite
        ]);
    }

    _updateSprites() {
        // Helper to sync sprite to body
        const sync = (sprite, body, offset) => {
            sprite.x = body.position.x - this.baseX + (offset.x || 0);
            sprite.y = body.position.y - this.baseY + (offset.y || 0);
            sprite.rotation = body.angle + (offset.angle || 0);
        };
        sync(this.robotBaseSprite, this.base, SPRITE_OFFSETS.base);
        sync(this.robotArmSprite, this.boom, SPRITE_OFFSETS.boom);
        sync(this.robotHeadSprite, this.head, SPRITE_OFFSETS.head);
        sync(this.pincer1Sprite, this.pincerLeft, SPRITE_OFFSETS.pincerLeft);
        sync(this.pincer2Sprite, this.pincerRight, SPRITE_OFFSETS.pincerRight);
    }

    // Call _updateSprites after any physics update or movement
    preUpdate(time, delta) {
        super.preUpdate && super.preUpdate(time, delta);
        this._updateSprites();
    }

    goTo(targetX, targetY, duration = 700) {
        if (this.currentTween) this.currentTween.stop();

        // --- Offset the target so the pincer tip (not just head end) reaches the true target ---
        // Estimate initial direction from base to target
        const dx = targetX - this.baseX;
        const dy = targetY - this.baseY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        let offsetX = targetX;
        let offsetY = targetY;
        if (dist > 1e-3) {
            // Move target back along the direction by half the pincer length
            offsetX = targetX - (dx / dist) * (this.pincerLength / 2);
            offsetY = targetY - (dy / dist) * (this.pincerLength / 2);
        }

        // --- Clamp to reachable workspace ---
        const maxReach = this.boomLength + this.headLength;
        const relDx = offsetX - this.baseX;
        const relDy = offsetY - this.baseY;
        const relDist = Math.sqrt(relDx * relDx + relDy * relDy);
        let clampedX = offsetX;
        let clampedY = offsetY;
        if (relDist > maxReach) {
            clampedX = this.baseX + (relDx / relDist) * maxReach;
            clampedY = this.baseY + (relDy / relDist) * maxReach;
            console.warn(`[IK] Target unreachable, clamping to closest point: (${clampedX.toFixed(2)}, ${clampedY.toFixed(2)})`);
        }

        const { boomAngle: targetBoom, headAngle: targetHeadRel } = this._solveIK(clampedX, clampedY);

        // Always wrap both start and target angles to [-PI, PI]
        const startBoom = PhaserMath.Angle.Wrap(this.boom.angle);
        const startHeadRel = PhaserMath.Angle.Wrap(this.head.angle - this.boom.angle);
        const targetBoomWrapped = PhaserMath.Angle.Wrap(targetBoom);
        const targetHeadRelWrapped = PhaserMath.Angle.Wrap(targetHeadRel);

        // Use ShortestBetween for minimal rotation
        const deltaBoom = PhaserMath.Angle.ShortestBetween(startBoom, targetBoomWrapped);
        const deltaHeadRel = PhaserMath.Angle.ShortestBetween(startHeadRel, targetHeadRelWrapped);

        this.currentTween = this.scene.tweens.addCounter({
            from: 0, to: 1, duration,
            onUpdate: t => {
                const v = t.getValue();
                const boomA = PhaserMath.Angle.Wrap(startBoom + deltaBoom * v);
                const headRelA = PhaserMath.Angle.Wrap(startHeadRel + deltaHeadRel * v);
                this._setArmAngles(boomA, headRelA);
            },
            onComplete: () => {
                this.currentTween = null;
                // --- Debug: log actual pincer tip vs target ---
                const headAngle = PhaserMath.Angle.Wrap(this.head.angle);
                // Pincer tip (pick left pincer tip as reference)
                const px = this.pincerLeft.position.x + Math.cos(headAngle) * this.pincerLength / 2;
                const py = this.pincerLeft.position.y + Math.sin(headAngle) * this.pincerLength / 2;
                const err = PhaserMath.Distance.Between(px, py, targetX, targetY);
                // console.log(`[IK DEBUG] Target: (${targetX.toFixed(2)}, ${targetY.toFixed(2)}), Pincer tip: (${px.toFixed(2)}, ${py.toFixed(2)}), Error: ${err.toFixed(2)}`);
            }
        });
    }

    setPincersDistance(distance, duration = 250) {
        distance = PhaserMath.Clamp(distance, this.pincerMinDist, this.pincerMaxDist);
        if (this.currentPincerTween) this.currentPincerTween.stop();
        const startDist = this._getPincersDistance();
        this.currentPincerTween = this.scene.tweens.addCounter({
            from: startDist, to: distance, duration,
            onUpdate: t => this._setPincersDistance(t.getValue()),
            onComplete: () => { this.currentPincerTween = null; }
        });
    }

    // --- Helpers ---

    _solveIK(targetX, targetY) {
        // 2-link planar IK for boom/head
        const dx = targetX - this.baseX;
        const dy = targetY - this.baseY;
        const L1 = this.boomLength;
        const L2 = this.headLength;
        const d = Math.sqrt(dx*dx + dy*dy);
        const maxReach = L1 + L2;
        const minReach = Math.abs(L1 - L2);

        if (d >= maxReach - 1e-6) {
            // Out of reach: fully extend toward target
            return { boomAngle: Math.atan2(dy, dx), headAngle: 0 };
        }

        // Clamp to reachable
        let reach = PhaserMath.Clamp(d, minReach, maxReach);
        // Law of cosines
        let cosA2 = PhaserMath.Clamp((L1*L1 + L2*L2 - reach*reach) / (2*L1*L2), -1, 1);
        let a2 = Math.acos(cosA2);
        let cosA1 = PhaserMath.Clamp((reach*reach + L1*L1 - L2*L2) / (2*reach*L1), -1, 1);
        let a1 = Math.atan2(dy, dx) - Math.acos(cosA1);
        // Alternate solution
        let altA2 = -a2;
        let altA1 = Math.atan2(dy, dx) + Math.acos(cosA1);
        // Prefer solution with smallest |headAngleRel|
        const sol1 = { boom: a1, head: a2 };
        const sol2 = { boom: altA1, head: altA2 };
        // Pick the solution with head angle closest to 0 (straight arm)
        const pick = Math.abs(PhaserMath.Angle.Wrap(a2)) < Math.abs(PhaserMath.Angle.Wrap(altA2)) ? sol1 : sol2;
        // If headRel is close to ±π, force to 0 (straight)
        if (Math.abs(PhaserMath.Angle.Wrap(pick.head)) > Math.PI * 0.99) {
            pick.head = 0;
        }
        // Log diagnostic info
        // console.log(
        //     `[IK] Target boom: ${pick.boom} (${PhaserMath.RadToDeg(pick.boom)} deg), headRel: ${pick.head} (${PhaserMath.RadToDeg(pick.head)} deg) | Current boom: ${this.boom.angle} (${PhaserMath.RadToDeg(this.boom.angle)} deg), headRel: ${this.head.angle - this.boom.angle} (${PhaserMath.RadToDeg(this.head.angle - this.boom.angle)} deg)`
        // );
        return { boomAngle: pick.boom, headAngle: Math.PI - pick.head };
    }

    _setArmAngles(boomAngle, headAngleRel) {
        // Debug: log angles and calculated head end position
        const boomDeg = PhaserMath.RadToDeg(boomAngle);
        const headRelDeg = PhaserMath.RadToDeg(headAngleRel);
        const headAbs = PhaserMath.Angle.Wrap(boomAngle + headAngleRel);
        const headAbsDeg = PhaserMath.RadToDeg(headAbs);
        // jointX is where the head joint attaches to boom
        const jointX = this.baseX + Math.cos(boomAngle) * (this.boomLength - this.headJointOffset);
        const jointY = this.baseY + Math.sin(boomAngle) * (this.boomLength - this.headJointOffset);
        // head center is offset from joint by (headLength/2 - headJointLocalOffset)
        const headCenterOffset = this.headLength/2 - this.headJointLocalOffset;
        const hx = jointX + Math.cos(headAbs) * headCenterOffset;
        const hy = jointY + Math.sin(headAbs) * headCenterOffset;
        // Pincer base is further by pincerDistanceFromHead
        const pincerBaseOffset = headCenterOffset + this.pincerDistanceFromHead;
        const pincerBaseX = jointX + Math.cos(headAbs) * pincerBaseOffset;
        const pincerBaseY = jointY + Math.sin(headAbs) * pincerBaseOffset;
        // console.log(`[ARM DEBUG] boom: ${boomDeg.toFixed(2)} deg, headRel: ${headRelDeg.toFixed(2)} deg, headAbs: ${headAbsDeg.toFixed(2)} deg | head center: (${hx.toFixed(2)}, ${hy.toFixed(2)})`);

        // Boom: center is halfway along boom from base
        this.matter.body.setPosition(this.boom, { x: this.baseX + Math.cos(boomAngle) * this.boomLength / 2, y: this.baseY + Math.sin(boomAngle) * this.boomLength / 2 });
        this.matter.body.setAngle(this.boom, boomAngle); // radians

        // Head: center is at the END of the boom, plus half head length in head direction
        this.matter.body.setPosition(this.head, { x: hx, y: hy });
        this.matter.body.setAngle(this.head, headAbs); // radians

        // Move pincers with the head
        this._setPincersDistance(this._getPincersDistance());
    }

    _setPincersDistance(distance) {
        // Place pincers at distance apart, centered on head END
        const angle = PhaserMath.Angle.Wrap(this.head.angle);
        // End of head
        const hx = this.head.position.x + Math.cos(angle) * this.headLength / 2;
        const hy = this.head.position.y + Math.sin(angle) * this.headLength / 2;
        // Pincer base is further by pincerDistanceFromHead
        const pincerBaseX = hx + Math.cos(angle) * this.pincerDistanceFromHead;
        const pincerBaseY = hy + Math.sin(angle) * this.pincerDistanceFromHead;
        const dx = Math.cos(angle + Math.PI / 2) * distance / 2;
        const dy = Math.sin(angle + Math.PI / 2) * distance / 2;
        this.matter.body.setPosition(this.pincerLeft, { x: pincerBaseX + dx, y: pincerBaseY + dy });
        this.matter.body.setAngle(this.pincerLeft, angle); // radians
        this.matter.body.setPosition(this.pincerRight, { x: pincerBaseX - dx, y: pincerBaseY - dy });
        this.matter.body.setAngle(this.pincerRight, angle); // radians
    }

    _getPincersDistance() {
        return PhaserMath.Distance.Between(
            this.pincerLeft.position.x, this.pincerLeft.position.y,
            this.pincerRight.position.x, this.pincerRight.position.y
        );
    }
}