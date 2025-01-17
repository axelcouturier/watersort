import { Container, Graphics } from "pixi.js";

// Define the structure of a single tube
export type TubeContent = {
    color: string; // The color of the water block
    hidden: boolean,
    graphics: Graphics | null; // The Graphics object representing the water block
}
export type Tube = {
    container: Container | null; // The PIXI.Container representing the tube
    content: TubeContent[]; // Array of water blocks in the tube
};
