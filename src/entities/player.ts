import * as LJS from "littlejsengine";
import { Microbe } from "./microbe";
import { globalBeat } from "../main";
import { DEG2RAD } from "../mathUtils";
import { BeatRipple } from "./ripple";

const { vec2, rgb } = LJS;

export class Player extends Microbe {
  timing: number = 0;

  constructor(pos: LJS.Vector2) {
    super(pos);
  }

  update(): void {
    // this.moveInput =
    //   LJS.mouseIsDown(0) || LJS.keyIsDown("Space") ? vec2(1, 0) : vec2(0, 0);

    if (LJS.mouseWasReleased(0) || LJS.keyWasReleased("Space")) {
      this.timing = globalBeat.getPercent(); // this is the distance from the current beat / subbeat
      this.swim();
      new BeatRipple(this.timing, globalBeat.count);
    }

    if (LJS.keyWasReleased("KeyD")) {
      this.angle += 45 * DEG2RAD;
    }
    if (LJS.keyWasReleased("KeyA")) {
      this.angle -= 45 * DEG2RAD;
    }

    super.update();
  }
}
