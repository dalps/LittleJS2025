import { DEG2RAD } from "../mathUtils";
import { bpm, Microbe } from "./microbe";
import * as LJS from "littlejsengine";
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
  animTimer = new LJS.Timer(0); // swim every second

  constructor(pos) {
    super(pos);
  }

  update(): void {
    if (this.animTimer.elapsed()) {
      const b = swimPatterns[this.currentPattern][this.currentBeat];

      if (b > 0) {
        this.angle += 45 * DEG2RAD;
        this.swim();
        this.animTimer.set(1 / b);
      } else {
        this.idle();
        this.animTimer.set(1 / 2);
      }
    }

    if (this.beatTimer.elapsed()) {
      this.currentBeat++;

      if (this.currentBeat === 4) {
        this.currentBeat = 0;
        // this.currentPattern = (this.currentPattern + 1) % swimPatterns.length;
        console.log(swimPatterns[this.currentPattern]);
      }

      this.beatTimer.set(60 / bpm);
    }

    // if (this.curresadntBeat === 4) {
    //   this.currentPattern = LJS.randInt(0, swimPatterns.length);
    // }

    super.update();
  }
}
