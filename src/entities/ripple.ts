import * as LJS from "littlejsengine";
import type { Beat } from "../beat";
import {
  tileSize
} from "../main";
import { accuracy, setAlpha } from "../mathUtils";
const { vec2, rgb, tile } = LJS;

export class BeatRipple extends LJS.Particle {
  offset = 0;

  constructor(
    pos: LJS.Vector2,
    spacingBeat: number,
    spacingSubBeat: number,
    public timing: number,
    public beat: Beat,
    tileInfo?: LJS.TileInfo
  ) {
    const startPos = pos.add(vec2(spacingBeat * beat.beatCount + timing, 0));

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

    const [b, sub] = beat.count;
    this.offset =
      (b + 1 === this.beat.beats &&
      sub + 1 === this.beat.subs &&
      this.timing > 0.5
        ? -spacingSubBeat
        : spacingBeat * b + spacingSubBeat * sub) + this.timing;
  }

  update(): void {
    this.pos = this.pos.add(vec2(this.offset, 0));

    super.update();
  }
}
