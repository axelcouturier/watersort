import { Move } from "./Move";

export type GameState = {
  tubeHeight: number;
  tubeCount: number,
  emptyTubes: number,
  rowCount: number,
  history: Move[]
};