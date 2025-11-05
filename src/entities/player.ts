import * as LJS from "littlejsengine";
import { currentSong, tileSize } from "../main";
import { accuracy, MyParticle } from "../mathUtils";
import { Microbe, minRadius, swimAccel } from "./microbe";
import { defaultMetronomePattern } from "../metronome";
import type { Beat } from "../beat";
import type { Song } from "../music";
import { sfx } from "../sfx";

const { vec2, rgb } = LJS;

export const perfectThreshold = 0.5;
export const goodThreshold = 1;

function randColor() {
  const opts = [LJS.YELLOW, LJS.RED, LJS.CYAN, LJS.PURPLE];
  return opts.at(LJS.randInt(0, opts.length - 1));
}

export const firework = (
  pos: LJS.Vector2,
  acc = 0,
  n = 5,
  color?: LJS.Color,
  size = 0.7,
  speed = 1,
  spin = 0
) => {
  const lifeTime = 1;
  const r1 = 0.25;
  const r2 = 0.25;
  const size1 = 0.35;
  const size2 = LJS.lerp(0.5, 1, 1 - acc);
  const mkSizeFunc = (maxSize: number) => (t: number) =>
    Math.sin(t * Math.PI) * maxSize;
  const tileInfo = LJS.tile(vec2(2, 1), tileSize, 2);

  for (let i = 0, phi = 0; i < n; i++, phi += (Math.PI * 2) / n) {
    const colorStart =
      color ?? LJS.randColor().add(new LJS.Color(0.1, 0.1, 0.1));

    new MyParticle(pos.add(vec2(1, 0).setAngle(phi, r1)), {
      tileInfo,
      lifeTime,
      colorStart,
      colorEnd: colorStart,
      sizeStart: size1,
      sizeEnd: size1,
      velocity: vec2(1, 0).setAngle(phi, speed * 0.5),
      angleVelocity: speed * 2,
      spin,
      sizeFunc: mkSizeFunc(size1),
      additive: true,
      trailScale: 1,
    });

    new MyParticle(pos.add(vec2(1, 0).setAngle(phi, r2)), {
      tileInfo,
      lifeTime,
      colorStart,
      colorEnd: colorStart,
      sizeStart: size2,
      sizeEnd: size2,
      velocity: vec2(1, 0).setAngle(phi, speed * 2),
      angleVelocity: speed * 2,
      spin,
      sizeFunc: mkSizeFunc(size2),
      additive: true,
      trailScale: 1,
    });
  }
};

export class Player extends Microbe {
  constructor(pos: LJS.Vector2, leader: Microbe, number = 1, song?: Song) {
    super(pos, leader, number, song);

    this.song?.beat.onpattern(defaultMetronomePattern, (note) => {
      note && this.idle();
    });

    this.actions = [this.idle, () => {}]
  }

  bump(other: Microbe): void {
    super.bump(other);

    this.applyForce(swimAccel.scale(other.phi > this.phi ? -0.5 : 0.5));
  }

  update(): void {
    if (LJS.mouseWasReleased(0) || LJS.keyWasReleased("Space")) {
      const timing = currentSong.metronome?.click() || 0;
      const acc = accuracy(timing);

      const pos = (LJS.mouseWasReleased(0) && LJS.mousePos) || this.pos;
      const speed = LJS.lerp(0.005, 0.05, 1 - acc);

      this.swim();

      if (acc < perfectThreshold) {
        firework(pos, acc, 10, undefined, undefined, speed, 0.05);
      } else if (acc < goodThreshold) {
        firework(pos, acc, 8, LJS.YELLOW, undefined, speed);
      }
    }

    super.update();
  }

  render(): void {
    super.render();

    LJS.drawText("You", this.pos.add(vec2(0, 1.2)), 0.5);
  }
}
