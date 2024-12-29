import { GameState } from "./types/GameState";
import { Tube } from "./types/Tube";

export const isSolved = (gameState: GameState, tubes: Tube[]): boolean => tubes.every(
    (tube) => tube.content.length === 0 || (tube.content.length === gameState.tubeHeight && tube.content.reduce((acc, curr) => acc && curr.color === tube.content[0].color, true))
);