// Based on Chris Wilson's implementation
//    https://github.com/cwilso/metronome

import * as LJS from "littlejsengine";
import { accuracy, formatTime, LOG } from "./mathUtils";
const { vec2, rgb } = LJS;

export type BeatCount = [number, number, number];
export type BeatListener = ([beat, sub, bar]: BeatCount) => void;

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

  /**
   * How frequently to call scheduling function
   */
  lookahead = 10;

  /**
   * How far ahead to schedule audio / animation
   */
  scheduleAheadTime = 0.5;
  nextNoteTime = 0.0;

  listeners: Map<string, BeatListener> = new Map();
  eventQueue: { fn: Function; time: number; arg: BeatCount }[] = [];

  timerWorker?: Worker; // The Web Worker used to fire timer messages

  delta: number;
  private _isPlaying: boolean = false;

  constructor(public bpm = 60, public beats = 4, public subs = 1) {
    this.delta = bpm && subs ? 60 / (bpm * subs) : 1;

    this.timerWorker = new Worker(new URL("./beatWorker.js", import.meta.url), {
      type: "module",
    });

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

  /**
   * Schedules callback, advances the counter and sets the timer.
   * Called every `this.lookahead` seconds.
   */
  private scheduler() {
    while (this.nextNoteTime < this.time + this.scheduleAheadTime) {
      // schedule future events
      if (this.elapsed > 0)
        for (let fn of this.listeners.values()) {
          // this.eventQueue.push({
          //   fn,
          //   time: this.nextNoteTime,
          //   arg: this.count,
          // });
          setTimeout(fn, this.elapsed, this.count);
        }

      // increase note counters
      this.nextNote();
    }
  }

  private nextNote() {
    this.nextNoteTime += this.delta;

    if (++this.subCount === this.subs) {
      if (++this.beatCount === this.beats) this.barCount++;
      this.beatCount %= this.beats;
    }
    this.subCount %= this.subs;
  }

  update() {
    const firstEvent = this.eventQueue.at(0);

    while (this.eventQueue.length && firstEvent!.time < this.time) {
      firstEvent!.fn(firstEvent!.arg);
      this.eventQueue.splice(0, 1);
    }
  }

  getPercent() {
    return LJS.percent(this.elapsed, 0, this.delta);
  }

  getAccuracy() {
    return accuracy(this.getPercent());
  }

  private getId() {
    return crypto.randomUUID();
  }

  removeListener(id: string) {
    this.listeners.delete(id);
  }

  /**
   * Register a callback to be executed at every sub-beat
   */
  onbeat(fn: BeatListener): string {
    let id = this.getId();
    this.listeners.set(id, fn);
    return id;
  }

  /**
   * Register a callback to be executed once at a specific beat count
   */
  atbeat([beat, sub, bar]: BeatCount, fn: () => void): string {
    let id = this.getId();
    this.listeners.set(id, ([b, s, br]) => {
      if (b === beat && s === sub && bar === br) {
        fn();
        this.listeners.delete(id);
      }
    });
    return id;
  }

  /**
   * Register a callback to be executed once at a specific beat count
   */
  onpattern<T>(
    ptn: Pattern<T>,
    listener: PatternListener<T>,
    sequencing = BarSequencing.HoldLast
  ): string {
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

    let id = this.getId();
    this.listeners.set(id, ([beat, sub, bar]) =>
      listener(ptn.at(barPicker(bar))?.at(beat)?.at(sub))
    );
    return id;
  }

  get count(): BeatCount {
    return [this.beatCount, this.subCount, this.barCount];
  }

  isPlaying() {
    return this._isPlaying;
  }

  play() {
    if (this.isPlaying()) return;

    this.timerWorker?.postMessage("start");
    this.barCount = this.beatCount = this.subCount = 0;
    this.nextNoteTime = LJS.audioContext.currentTime;
    this._isPlaying = true;
  }

  stop() {
    this.timerWorker?.postMessage("stop");
    this.listeners.clear();
    this._isPlaying = false;
  }
}
