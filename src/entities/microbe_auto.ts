import * as LJS from "littlejsengine";
import { DEG2RAD } from "../mathUtils";
import { Microbe } from "./microbe";
import type { BeatCount } from "../beat";
const { vec2, rgb } = LJS;

const swimPatterns = [
  [1, 1, 1, 1],
  [3, 3, 1, 1],
  [1, 1, 0, 3],
  [2, 0, 2, 0],
  [1, 1, 3, 1],
];

export class AutoMicrobe extends Microbe {
  currentPattern: number = 3;

  constructor(pos: LJS.Vector2) {
    super(pos);
  }

  override onbeat([beat]: BeatCount) {
    const b = swimPatterns[this.currentPattern][beat];

    if (b > 0) {
      this.angle += 45 * DEG2RAD;
      this.swim();
    } else {
      this.idle();
    }
  }
}
