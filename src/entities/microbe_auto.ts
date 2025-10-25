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
  constructor(phi, dist) {
    super(phi, dist);

    this.beat.onpattern(swimPatterns.slice(0, 2), this.onpattern.bind(this));
  }

  onpattern(note?: number) {
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
