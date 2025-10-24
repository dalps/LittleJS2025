import * as LJS from "littlejsengine";
import type { BeatCount } from "../beat";
import {
  globalBeat,
  metronomePos,
  spacingBeat,
  spacingSubBeat,
  tileSize,
} from "../main";
import { setAlpha } from "../mathUtils";
const { vec2, rgb, tile } = LJS;

export class BeatRipple extends LJS.Particle {
  constructor(
    public timing: number,
    public count: BeatCount,
    tileInfo?: LJS.TileInfo
  ) {
    const startPos = LJS.cameraPos
      .subtract(metronomePos)
      .add(vec2(spacingBeat * globalBeat.beatCount + timing, 0));

    // https://www.desmos.com/calculator/ln6rtzn9kb
    const accuracy = Math.sin(timing * Math.PI) ** 0.5;

    const lifeTime = 0.5;
    const startRadius = 1;
    const startColor = new LJS.Color(accuracy, 1 - accuracy, 0, 1);
    const finalRadius = LJS.lerp(2, 1, accuracy);

    super(
      startPos,
      tileInfo ?? tile(vec2(1, 0), tileSize, 2),
      0,
      startColor,
      setAlpha(startColor, 0),
      lifeTime,
      startRadius,
      finalRadius,
      0,
      true,
      0
    );
  }

  update(): void {
    const [beat, sub] = this.count;
    const x = spacingBeat * beat + spacingSubBeat * sub + this.timing;

    this.pos = LJS.cameraPos.subtract(metronomePos).add(vec2(x, 0));

    super.update();
  }
}
