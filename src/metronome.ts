import * as LJS from "littlejsengine";
import type { Beat, Pattern, TimingInfo } from "./beat";
import { font, spriteAtlas, tileSize } from "./main";
import { LOG, setAlpha } from "./mathUtils";
import { MyParticle } from "./particleUtils";
import { Ease, Tween } from "./tween";
import { goodThreshold, perfectThreshold } from "./entities/player";
const { vec2, rgb, tile } = LJS;

export const spacingBeat = 75;
export const metronomeY = 10;
const textSize = 32;
const textLineWidth = 4;
const radiusBeat = 20;
const radiusSubBeat = 10;
export const metronomeColor = LJS.rgb(1, 1, 0, 0.5);

// prettier-ignore
export const countInMetronomePattern = [
  [
    [2, ],
    [ , ],
    [2, ],
    [ , ],
  ],
  [
    [2, ],
    [1, ],
    [1, ],
    [1, ],
  ],
];

// prettier-ignore
export const defaultMetronomePattern: Pattern<number> = [
  [
    [2, ],
    [1, ],
    [2, ],
    [1, ],
  ],
];

// (b + 1 === beat.beats && sub + 1 === beat.subs && timing > 0.5
//       ? -spacingSubBeat
//       : spacingBeat * b + spacingSubBeat * sub) + timing;

/**
 * Visualizes and updates a beat every frame
 */
export class Metronome extends LJS.UIObject {
  spacingSubBeat: number;
  private beatHandle?: string;
  private _score = 0;

  get score() {
    return this._score;
  }

  constructor(
    pos: LJS.Vector2,
    public beat: Beat,
    public pattern: Pattern<number> = defaultMetronomePattern
  ) {
    super(pos);

    // centering
    this.spacingSubBeat = spacingBeat / (beat.subs || 1);
    this.pos = pos.subtract(
      vec2((spacingBeat * beat.beats - this.spacingSubBeat) * 0.5, 0)
    );

    this.visible = false;
  }

  start() {
    // this.beatHandle = this.beat.onpattern(this.pattern, (note) => {
    //   // LOG(`[metronome] tic ${note}`);
    //   sfx.tic.play(LJS.cameraPos, note ? 0.5 : 0, note);
    // });
    this.show();
  }

  stop(): void {
    LOG(`Stopping metronome... ${this.beatHandle}`);
    this.hide();
    this.beatHandle && this.beat.removeListener(this.beatHandle);
  }

  destroy(): void {
    this.stop();
    super.destroy();
  }

  click(): TimingInfo {
    // the distance from the current beat / subbeat
    const { timing, accuracy } = this.beat.getPercent();
    const {
      spacingSubBeat,
      beat: {
        count: [b, sub],
      },
    } = this;

    // update the score
    this._score += accuracy;

    if (!this.visible) return { timing, accuracy };

    // visualize the timing with a ripple
    const colorStart = rgb(1 - accuracy, accuracy, 0, 1); // +accuracy -> -red +green
    
    const offset =
    (b + 1 === this.beat.beats && sub + 1 === this.beat.subs && timing > 0.5
      ? -spacingSubBeat
      : spacingBeat * b + spacingSubBeat * sub) +
      LJS.lerp(0, spacingSubBeat, timing);
      
      new MyParticle(
        this.pos.add(vec2(offset, 0)), //
        {
          tileInfo:
          accuracy >= perfectThreshold
          ? spriteAtlas["smiley_happy"]
          : accuracy >= goodThreshold
          ? spriteAtlas["smiley_smile"]
          : spriteAtlas["smiley_frown"],
          lifeTime: 30,
          colorStart,
          colorEnd: setAlpha(colorStart, 0),
          sizeStart: 50,
          sizeEnd: 50,
          trailRate: 0,
          fadeRate: 0,
          screenSpace: true,
          sizeEase: Ease.OUT(Ease.CIRC),
        }
      );

      new MyParticle(
        this.pos.add(vec2(offset, 0)), //
        {
          tileInfo: tile(vec2(1, 0), tileSize, 2),
          lifeTime: 10,
          colorStart,
          colorEnd: setAlpha(colorStart, 0),
          sizeStart: 70,
          sizeEnd: LJS.lerp(70, 250, accuracy),
          trailRate: 0,
          fadeRate: 0,
          screenSpace: true,
          sizeEase: Ease.OUT(Ease.CIRC),
          name: "ripple",
        }
      );
      
      return { timing, accuracy };
    }
    
    show() {
      this.visible = true;
      new Tween(
        (t) => (this.pos.y = t),
        -200,
        LJS.mainCanvasSize.y * 0.1,
        100
      ).setEase(Ease.OUT(Ease.EXPO));
  }

  hide() {
    new Tween((t) => (this.pos.y = t), LJS.mainCanvasSize.y * 0.1, -200, 100)
      .setEase(Ease.OUT(Ease.EXPO))
      .then(() => {
        this.visible = false;
      });
  }

  render() {
    const { beat, spacingSubBeat } = this;

    const correctedBeatCount =
      (beat.beatCount < 1 ? beat.beats : beat.beatCount) - 1;

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
        i === correctedBeatCount && beat.subCount === 0 ? LJS.YELLOW : LJS.BLUE,
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
          i === correctedBeatCount && j + 1 === beat.subCount
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
