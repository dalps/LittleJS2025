import * as LJS from "littlejsengine";
const { vec2, rgb } = LJS;

export type BeatCount = [number, number];
type BeatListener = ([beat, sub]: BeatCount) => void;

export class Beat extends LJS.Timer {
  delta: number;
  subCount = 0;
  beatCount = 0;
  listeners: BeatListener[] = [];

  constructor(public bpm = 60, public beats = 4, public subs = 1) {
    let delta = bpm && subs ? 60 / bpm / subs : 1;

    super(delta);
    this.delta = delta;
  }

  onbeat(f: BeatListener) {
    this.listeners.push(f);
  }

  update() {
    if (this.elapsed()) {
      this.listeners.forEach((l) => l([this.beatCount, this.subCount]));

      this.set(this.delta);

      this.subCount++;

      if (this.subCount === this.subs) {
        this.beatCount++;
        this.beatCount %= this.beats;
      }

      this.subCount %= this.subs;
    }
  }
}
