import * as LJS from "littlejsengine";
import type { Beat } from "./beat";
import { BeatRipple } from "./entities/ripple";
import { font } from "./main";
import { sfx } from "./sfx";
import { LOG } from "./mathUtils";
const { vec2, rgb } = LJS;

export const spacingBeat = 75;
export const metronomeY = 10;
const textSize = 32;
const textLineWidth = 4;
const radiusBeat = 20;
const radiusSubBeat = 10;
export const metronomeColor = LJS.rgb(1, 1, 0, 0.5);

// prettier-ignore
export const defaultMetronomePattern = [
  [
    [2,],
    [1,],
    [2,],
    [1,],
  ],
];

/**
 * Visualizes and updates a beat every frame
 */
export class Metronome extends LJS.UIObject {
  spacingSubBeat: number;
  constructor(
    pos: LJS.Vector2,
    public beat: Beat,
    public pattern = defaultMetronomePattern
  ) {
    super(pos);

    this.spacingSubBeat = spacingBeat / (beat.subs || 1);
    this.pos = pos.subtract(
      vec2((spacingBeat * beat.beats - this.spacingSubBeat) * 0.5, 0)
    );

    beat.onpattern(pattern, (note) => {
      // LOG("[metronome] tic");
      sfx.tic.play(undefined, note ? 0.5 : 0, note);
    });
  }

  click(): number {
    const timing = this.beat.getPercent(); // this is the distance from the current beat / subbeat

    new BeatRipple(
      this.pos,
      spacingBeat,
      this.spacingSubBeat,
      timing,
      this.beat
    );

    return timing;
  }

  render() {
    const { beat, spacingSubBeat } = this;

    for (
      let i = 0, pi = this.pos;
      i < beat.beats;
      i++, pi = pi.add(vec2(spacingBeat, 0))
    ) {
      // LJS.drawCircle(pi, rBeat, color);
      LJS.drawTextScreen(
        `${i + 1}`,
        pi,
        textSize,
        i === beat.beatCount && beat.subCount === 0 ? LJS.YELLOW : LJS.BLUE,
        textLineWidth,
        LJS.WHITE,
        "center",
        font
      );

      for (
        let j = 0, pj = pi.add(vec2(spacingSubBeat, 0));
        j < beat.subs - 1;
        j++, pj = pj.add(vec2(spacingSubBeat, 0))
      ) {
        LJS.drawCircle(
          pj,
          radiusSubBeat,
          i === beat.beatCount && j + 1 === beat.subCount
            ? LJS.YELLOW
            : metronomeColor,
          undefined,
          undefined,
          undefined,
          true
        );
      }
    }
  }
}
