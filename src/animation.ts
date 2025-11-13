import * as LJS from "littlejsengine";
import { spriteAtlas } from "./main";
const { vec2, rgb, Timer } = LJS;

export class Animation {
  private currentFrame = 0;
  private timer: LJS.Timer;
  private repeats = 0;
  private playing = false;
  private delta: number;
  public priority: number;

  constructor(
    /** A label for the animation */
    public name: string,
    /** How many frames does the animation consist of? */
    public duration: number,
    { delta = 1 / LJS.frameRate, priority = 0 } = {}
  ) {
    this.delta = delta;
    this.priority = priority;
    this.timer = new Timer(delta);
  }

  update() {
    if (this.done()) return;

    if (this.timer.elapsed()) {
      this.currentFrame++;

      if (this.currentFrame === this.duration) {
        this.repeats++;
        this.playing = false;
        this.currentFrame = 0;
      }

      this.timer.set(this.delta);
    }
  }

  play() {
    this.currentFrame = 0;
    this.repeats = 0;
    this.playing = true;
    this.timer.set(this.delta);
  }

  done() {
    return this.repeats > 0;
  }

  isPlaying() {
    return this.playing;
  }

  /**
   * Look up the tile for the current frame in the given texture.
   */
  getFrame(tileInfo: LJS.TileInfo) {
    return tileInfo.frame(this.currentFrame % this.duration);
  }
}
