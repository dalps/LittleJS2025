import * as LJS from "littlejsengine";
import { Microbe } from "./microbe";
import { BarSequencing, Beat } from "../beat";
const { vec2, rgb } = LJS;



/** A microbe that swims automatically to a beat */
export class AutoMicrobe extends Microbe {
  actions = [this.idle, this.swim, () => (this.newCenter(), this.swim())];

  constructor(
    pos: LJS.Vector2,
    leader?: Microbe | undefined,
    number = 0,
    beat?: Beat
  ) {
    super(pos, leader, number, beat);

    this.beat?.onpattern(
      choreography,
      (note) => note !== undefined && this.actions.at(note)?.call(this),
      BarSequencing.Loop
    );
  }
}
