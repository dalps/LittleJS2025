import * as LJS from "littlejsengine";
import { DEG2RAD } from "../mathUtils";
import { Microbe } from "./microbe";
import type { BeatCount } from "../beat";
import { globalBeat } from "../main";
const { vec2, rgb } = LJS;

// prettier-ignore
const swimPatterns = [
  [
    [1, ],
    [1, ],
    [1, ],
    [1,1],
  ],
  [
    [ , ],
    [1,1],
    [ , ],
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
    [ , ],
    [ , ],
  ],
];

/** A microbe that swims automatically to a beat */
export class AutoMicrobe extends Microbe {
  pattern: number = 0 // LJS.randInt(0, swimPatterns.length);

  constructor(phi, dist) {
    super(phi, dist);
  }

  override onbeat([beat, sub]: BeatCount) {
    const note = swimPatterns.at(this.pattern)?.at(beat)?.at(sub);

    if (note) {
      this.swim();
    } else {
      this.idle();
    }
  }
}
