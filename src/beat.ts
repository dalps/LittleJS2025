// Based on Chris Wilson's implementation
//    https://github.com/cwilso/metronome

import * as LJS from "littlejsengine";
import { accuracy } from "./mathUtils";
import BeatWorker from "./beatWorker?worker";
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

export class Beat {
  barCount = 0;
  subCount = 0;
  beatCount = 0;

  lookahead = 25.0; // How frequently to call scheduling function
  scheduleAheadTime = 0.1; // How far ahead to schedule audio / animation
  nextNoteTime = 0.0;

  listeners: BeatListener[] = [];

  timerWorker?: Worker; // The Web Worker used to fire timer messages

  delta: number;

  constructor(public bpm = 60, public beats = 4, public subs = 1) {
    this.delta = bpm && subs ? 60 / (bpm * subs) : 1;

    this.timerWorker = new BeatWorker();

    this.timerWorker.onmessage = (e: MessageEvent) => {
      if (e.data === "tick") this.scheduler();
    };

    this.timerWorker.postMessage({ interval: this.lookahead });
  }

  private get time() {
    return LJS.audioContext.currentTime;
  }

  private get elapsed() {
    return this.nextNoteTime - this.time;
  }

  private scheduler() {
    while (this.nextNoteTime < this.time + this.scheduleAheadTime) {
      // schedule future events
      this.listeners.forEach((fn) => setTimeout(fn, this.elapsed, this.count));

      // increase note counters
      this.nextNote();
    }
  }

  getPercent() {
    return LJS.percent(this.elapsed, 0, this.delta);
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

  play(startTime = 0) {
    this.timerWorker?.postMessage("start");
    this.nextNoteTime = startTime;
  }

  stop() {
    this.timerWorker?.postMessage("stop");
    this.barCount = this.beatCount = this.subCount = 0;
  }

  private nextNote() {
    console.log(this.nextNoteTime);
    this.nextNoteTime += this.delta;

    this.subCount++;
    if (this.subCount === this.subs) {
      this.beatCount++;

      if (this.beatCount === this.beats) this.barCount++;

      this.beatCount %= this.beats;
    }
    this.subCount %= this.subs;
  }
}
