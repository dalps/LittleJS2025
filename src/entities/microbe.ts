import * as LJS from "littlejsengine";
import { spriteAtlas } from "../main";
const { vec2, rgb } = LJS;

export const tileSize = vec2(100, 100);

export class Microbe extends LJS.EngineObject {
  angle = 0;
  animationFrame = 0;
  animationTime = 1 / 60;
  animationDuration = 10; // frames
  animationTimer = new LJS.Timer(this.animationTime);

  constructor() {
    super();
    this.size = vec2(10);
  }

  render(): void {
    // update animation
    this.tileInfo = spriteAtlas["player"].frame(this.animationFrame);

    if (this.animationTimer.elapsed()) {
      this.animationFrame++;
      this.animationTimer.set(this.animationTime);
    }

    super.render();
  }
}
