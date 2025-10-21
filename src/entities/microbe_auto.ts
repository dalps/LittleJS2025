import { DEG2RAD } from "../mathUtils";
import { Microbe } from "./microbe";
import * as LJS from "littlejsengine";
const { vec2, rgb } = LJS;

const bpm = 60;
const swimPatterns = [
  [1, 1, 1, 1],
  [3, 3, 1, 1],
  [1, 1, 0, 3],
  [2, 0, 2, 0],
  [1, 1, 3, 1],
];

export class AutoMicrobe extends Microbe {
  currentPattern: number = 3;
  currentBeat: number = 0;

  beatTimer = new LJS.Timer(60 / bpm); // swim every second
  swimTimer = new LJS.Timer(0); // swim every second

  constructor(pos) {
    super(pos);
  }

  update(): void {
    if (this.swimTimer.elapsed()) {
      const b = swimPatterns[this.currentPattern][this.currentBeat];
      
      if (b > 0) {
        this.angle += 45 * DEG2RAD;
        this.swim();
      }
      
      this.swimTimer.set(b > 0 ? 1 / b : 1);
    }
    
    if (this.beatTimer.elapsed()) {
      this.currentBeat++;
      
      if (this.currentBeat === 4) {
        this.currentBeat = 0;
        // this.currentPattern = (this.currentPattern + 1) % swimPatterns.length;
        console.log(swimPatterns[this.currentPattern])
      }

      this.beatTimer.set(60 / bpm);
    }

    // if (this.currentBeat === 4) {
    //   this.currentPattern = LJS.randInt(0, swimPatterns.length);
    // }

    super.update();
  }
}
