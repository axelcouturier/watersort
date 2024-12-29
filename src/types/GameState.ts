import { Tube } from "./Tube";

export type GameState = {
    tubeHeight: number;
    tubes: Tube[];
    selectedTube: number | null;
  };