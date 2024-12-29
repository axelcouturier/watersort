import { Container, Graphics } from "pixi.js";

// Define the structure of a single tube
export type Tube = {
    container: Container | null; // The PIXI.Container representing the tube
    waterLevels: Graphics[]; // Array of PIXI.Graphics objects (water blocks)
    colors: string[]; // Array of colors representing the water stack (e.g., ['red', 'blue'])
};
