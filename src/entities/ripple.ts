import * as LJS from "littlejsengine";
import type { BeatCount } from "../beat";
import {
  globalBeat,
  metronomePos,
  spacingBeat,
  spacingSubBeat,
  tileSize,
} from "../main";
import { accuracy, setAlpha } from "../mathUtils";
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
    const acc = accuracy(timing);

    const lifeTime = 0.5;
    const startRadius = 1;
    const startColor = new LJS.Color(acc, 1 - acc, 0, 1);
    const finalRadius = LJS.lerp(2, 1, acc);

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
    const x =
      (beat + 1 === globalBeat.beats &&
      sub + 1 === globalBeat.subs &&
      this.timing > 0.5
        ? -spacingSubBeat
        : spacingBeat * beat + spacingSubBeat * sub) + this.timing;

    this.pos = LJS.cameraPos.subtract(metronomePos).add(vec2(x, 0));

    super.update();
  }
}
