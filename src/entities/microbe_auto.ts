import * as LJS from "littlejsengine";
import { globalBeat } from "../main";
import { Microbe } from "./microbe";
import { repeat } from "../mathUtils";
import { BarSequencing } from "../beat";
const { vec2, rgb } = LJS;

// prettier-ignore
const p1 = [
  [0, ],
  [0, ],
  [0, ],
  [0, ],
];

// prettier-ignore
const p2 = [
  [0, ],
  [1, ],
  [0, ],
  [1, ],
];

export const swimPatterns = [
  repeat(p1, 4),
  repeat(p2, 16),
  repeat(p1, 4),
  repeat(p2, 16),
].flat();

/** A microbe that swims automatically to a beat */
export class AutoMicrobe extends Microbe {
  swimCallbacks = [this.idle, this.swim];

  constructor(pos: LJS.Vector2, beat = globalBeat) {
    super(pos, beat);

    this.beat.onpattern(
      swimPatterns,
      (note) => note !== undefined && this.swimCallbacks.at(note)?.call(this),
      BarSequencing.Loop
    );
  }
}
