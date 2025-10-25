import * as LJS from "littlejsengine";
import { Microbe } from "./microbe";
import { globalBeat, tileSize } from "../main";
import { accuracy, DEG2RAD, particle, setAlpha } from "../mathUtils";
import { BeatRipple } from "./ripple";

const { vec2, rgb } = LJS;

export const perfectThreshold = 0.1;
export const goodThreshold = 0.6;

export const firework = (
  pos: LJS.Vector2,
  n = 5,
  color?: LJS.Color,
  size = 0.7,
  speed = 1
) => {
  const r1 = 1;
  const r2 = 0.25;

  for (let i = 0, phi = 0; i < n; i++, phi += (Math.PI * 2) / n) {
    const c = color ?? LJS.randColor();

    const p1 = particle(pos.add(vec2().setAngle(phi, r1)), {
      tileInfo: LJS.tile(vec2(13, 0), tileSize, 2),
      colorStart: c,
      colorEnd: setAlpha(c, 0),
      sizeStart: size / 2,
      sizeEnd: size / 2,
    });

    const p2 = particle(pos.add(vec2().setAngle(phi, r2)), {
      tileInfo: LJS.tile(vec2(13, 0), tileSize, 2),
      colorStart: c,
      colorEnd: setAlpha(c, 0),
      sizeStart: size,
      sizeEnd: size,
    });

    p1.velocity = vec2(1, 0).setAngle(phi, speed * 0.1);
    p2.velocity = vec2(1, 0).setAngle(phi, speed);

    p1.angleVelocity = speed;
    p2.angleVelocity = speed;
  }
};

export class Player extends Microbe {
  timing: number = 0;

  constructor(phi, dist) {
    super(phi, dist);
  }

  update(): void {
    // this.moveInput =
    //   LJS.mouseIsDown(0) || LJS.keyIsDown("Space") ? vec2(1, 0) : vec2(0, 0);

    // console.log(this.phi, this.dist);

    if (LJS.mouseWasReleased(0) || LJS.keyWasReleased("Space")) {
      this.timing = globalBeat.getPercent(); // this is the distance from the current beat / subbeat
      this.swim();

      new BeatRipple(this.timing, globalBeat.count);

      const acc = accuracy(this.timing);
      const nStars = Math.round(LJS.lerp(3, 15, 1 - acc));
      const speed = LJS.lerp(0.01, 0.1, 1 - acc);

      if (acc < perfectThreshold) {
        firework(this.pos, nStars, undefined, undefined, speed);
      } else if (acc < goodThreshold) {
        firework(this.pos, nStars, LJS.YELLOW, undefined, speed);
      }
    }

    super.update();
  }
}
