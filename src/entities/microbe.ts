import * as LJS from "littlejsengine";
import { spriteAtlas } from "../main";
const { vec2, rgb } = LJS;

export const tileSize = vec2(100, 100);

export class Microbe extends LJS.EngineObject {
  moveInput: LJS.Vector2 = vec2(0, 0);
  angle = 0;
  animationFrame = 0;
  animationDelta = 1 / 30;
  animationDuration = 10; // frames
  animationTimer = new LJS.Timer(this.animationDelta);

  constructor(pos: LJS.Vector2) {
    super(pos);
    this.size = vec2(10);
  }

  render(): void {
    // update animation
    this.tileInfo = spriteAtlas["swim"].frame(this.animationFrame);

    if (
      this.animationTimer.elapsed() &&
      this.animationFrame < this.animationDuration
    ) {
      this.animationFrame++;
      this.animationTimer.set(this.animationDelta);
    }

    super.render();
  }

  swim() {
    this.animationFrame = 0;
  }
}
