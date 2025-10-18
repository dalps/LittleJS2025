import * as LJS from "littlejsengine";
const { vec2, rgb } = LJS;
import { Microbe } from "./microbe";

export class Player extends Microbe {
  constructor(pos: LJS.Vector2) {
    super(pos);
  }

  update(): void {
    // this.moveInput =
    //   LJS.mouseIsDown(0) || LJS.keyIsDown("Space") ? vec2(1, 0) : vec2(0, 0);

    if (LJS.mouseWasReleased(0) || LJS.keyWasReleased("Space")) {
      this.swim();
    }

    super.update();
  }
}
