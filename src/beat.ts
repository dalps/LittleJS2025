import * as LJS from "littlejsengine";
import { accuracy } from "./mathUtils";
const { vec2, rgb } = LJS;

export type BeatCount = [number, number, number];
export type BeatListener = ([beat, sub]: BeatCount) => void;

export type Pattern<T> = (T | undefined)[][][]; // bar, beat, sub-beat
export type PatternListener<T> = (note: T | undefined) => void;
export enum BarSequencing {
  Loop,
  HoldLast,
  End,
}

export class Beat extends LJS.Timer {
  delta: number;
  barCount = 0;
  subCount = 0;
  beatCount = 0;
  listeners: BeatListener[] = [];

  constructor(public bpm = 60, public beats = 4, public subs = 1) {
    let delta = bpm && subs ? 60 / (bpm * subs) : 1;

    super(delta, true);
    this.delta = delta;
  }

  getAccuracy() {
    return accuracy(this.getPercent());
  }

  onbeat(f: BeatListener) {
    this.listeners.push(f);
  }

  onpattern<T>(
    ptn: Pattern<T>,
    listener: PatternListener<T>,
    sequencing = BarSequencing.HoldLast
  ) {
    let nBars = ptn.length;
    let barPicker: (b: number) => number;

    switch (sequencing) {
      case BarSequencing.Loop:
        barPicker = (bar) => bar % nBars;
        break;
      case BarSequencing.HoldLast:
        barPicker = (bar) => Math.min(bar, nBars - 1);
        break;
      case BarSequencing.End:
        barPicker = (bar) => bar;
        break;
    }

    this.listeners.push(([beat, sub, bar]) =>
      listener(ptn.at(barPicker(bar))?.at(beat)?.at(sub))
    );
  }

  get count(): BeatCount {
    return [this.beatCount, this.subCount, this.barCount];
  }

  update() {
    if (this.elapsed()) {
      console.log(this.getGlobalTime(), this.setTime, this.time, LJS.time);
      this.set(this.delta);

      this.subCount++;

      if (this.subCount === this.subs) {
        this.beatCount++;

        if (this.beatCount === this.beats) this.barCount++;

        this.beatCount %= this.beats;
      }

      this.subCount %= this.subs;

      this.listeners.forEach((f) => f(this.count));
    }
  }

  sync(that: Beat) {
    this.beatCount = that.beatCount;
    // this.subCount = that.subCount = 0;
  }
}
