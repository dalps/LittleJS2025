import * as LJS from "littlejsengine";
import type { BeatCount } from "../beat";
import { Microbe } from "./microbe";
const { vec2, rgb } = LJS;

// prettier-ignore
export const swimPatterns = [
  [
    [0, ],
    [0, ],
    [0,0],
    [0,0],
  ],
  [
    [1,0],
    [1,0],
    [1,0],
    [1,1],
  ],
  [
    [ ,0],
    [1,1],
    [ ,0],
    [1,1],
  ],
  [
    [ ,1],
    [ ,1],
    [ ,1],
    [ ,1],
  ],
  [
    [ ,1],
    [1,1],
    [ ,0],
    [ ,0],
  ],
];

/** A microbe that swims automatically to a beat */
export class AutoMicrobe extends Microbe {
  pattern: number = 1; // LJS.randInt(0, swimPatterns.length);

  constructor(phi, dist) {
    super(phi, dist);
  }

  override onbeat([beat, sub, bar]: BeatCount) {
    const note = swimPatterns
      .at(bar > 0 ? this.pattern : 0)
      ?.at(beat)
      ?.at(sub);

    // 1 bar count-in
    switch (note) {
      case 1:
        this.swim();

        break;

      case 0:
        this.idle();
        break;

      default:
        break;
    }
  }
}
