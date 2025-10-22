import * as LJS from "littlejsengine";
import { spriteAtlas } from "./main";
const { vec2, rgb, Timer } = LJS;

export class Animation {
  currentFrame = 0;
  timer: LJS.Timer;
  repeats = 0;
  tileInfo: LJS.TileInfo;

  constructor(
    public name: string,
    public duration: number,
    private delta: number,
    tileInfo?: LJS.TileInfo
  ) {
    this.timer = new Timer(delta);
    this.tileInfo ||= spriteAtlas[this.name];
  }

  update() {
    if (this.done()) return;

    if (this.timer.elapsed()) {
      this.currentFrame++;

      if (this.currentFrame === this.duration) {
        this.repeats++;
        this.currentFrame = 0;
      }

      this.timer.set(this.delta);
    }
  }

  play() {
    this.currentFrame = 0;
    this.repeats = 0;
    this.timer.set(this.delta);
  }

  done() {
    return this.repeats > 0;
  }

  get frame() {
    console.log(this.currentFrame);
    return this.tileInfo.frame(this.currentFrame % this.duration);
  }
}
