import * as LJS from "littlejsengine";
import { Microbe } from "./microbe";
import { globalBeat, tileSize } from "../main";
import { accuracy, DEG2RAD, particle, setAlpha } from "../mathUtils";
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

      const acc = accuracy(this.timing);

      const perfectThreshold = 0.1;
      const goodThreshold = 0.8;

      const makeStars = (n: number, color?: LJS.Color) => {
        for (let i = 0; i < n; i++) {
          const c = color ?? LJS.randColor();

          const phi = i * ((Math.PI * 2) / n);
          const r = 0.25;
          const p = particle(this.pos.add(vec2().setAngle(phi, r)), {
            tileInfo: LJS.tile(vec2(12, 0), tileSize, 2),
            colorStart: c,
            colorEnd: setAlpha(c, 0),
            sizeStart: 0.7,
            sizeEnd: 0.7,
          });

          const v = LJS.lerp(0.01, 0.1, 1 - acc);
          p.velocity = vec2(1, 0).setAngle(phi, v);
          p.angleVelocity = v;
        }
      };

      const nStars = Math.round(LJS.lerp(3, 15, 1 - acc));
      if (acc < perfectThreshold) {
        makeStars(nStars);
      } else if (acc < goodThreshold) {
        makeStars(nStars, LJS.YELLOW);
      }
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
