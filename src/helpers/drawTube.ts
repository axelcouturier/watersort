import { Container, Graphics, Text } from "pixi.js";
import { GameState } from "../types/GameState";
import { Tube } from "../types/Tube";

export function drawTube(gameState: GameState, tube: Tube, x: number, y: number): Tube {
    console.log('drawTube', tube)
    if (tube.container !== null) {
        tube.container.removeFromParent();
    }
    tube.container = new Container();
    tube.container.x = x;
    tube.container.y = y;
    // Make the tubes interactive for pointer events
    tube.container.interactive = true;
    // Draw the outline of the tube
    const outline = new Graphics();
    outline.rect(0, 0, 50, gameState.tubeHeight * 50); // Define rectangle shape
    outline.fill({ color: 0xffffff }); // White fill
    outline.stroke({ width: 2, color: 0x000000 }); // Black border
    tube.container.addChild(outline);
    // Add water blocks inside the tube (leave some tubes empty)

    if (tube.content.length >= 1) {
        for (let j = 0; j < tube.content.length; j++) {
            const water = new Graphics();
            water.rect(0, 50 * gameState.tubeHeight - (j + 1) * 50, 50, 50); // Define water block shape
            water.fill({ color: tube.content[j].hidden ? 'black' : tube.content[j].color }); // Assign colors cyclically
            tube.container.addChild(water);
            tube.content[j].graphics = water;
        }
    }
    return tube;
}