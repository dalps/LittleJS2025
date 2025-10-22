import * as LJS from "littlejsengine";
import { DEG2RAD } from "../mathUtils";
import { Microbe } from "./microbe";
import type { BeatCount } from "../beat";
const { vec2, rgb } = LJS;

// prettier-ignore
const swimPatterns = [
  [
    [1, ],
    [1, ],
    [1, ],
    [1, ],
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

export class AutoMicrobe extends Microbe {
  pattern: number = LJS.randInt(0, swimPatterns.length);

  constructor(pos: LJS.Vector2) {
    super(pos);
  }

  override onbeat([beat, sub]: BeatCount) {
    const note = swimPatterns.at(this.pattern)?.at(beat)?.at(sub);

    if (note) {
      this.angle += 45 * DEG2RAD;
      this.swim();
    } else {
      this.idle();
    }
  }
}
