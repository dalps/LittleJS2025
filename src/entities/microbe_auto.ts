import * as LJS from "littlejsengine";
import { globalBeat } from "../main";
import { Microbe } from "./microbe";
import { repeat } from "../mathUtils";
import { BarSequencing } from "../beat";
const { vec2, rgb } = LJS;

// prettier-ignore
const p1 = [
  [0, ],
  [0, ],
  [0, ],
  [0, ],
];

// prettier-ignore
const p2 = [
  [2, ],
  [1, ],
  [1, ],
  [1, ],
];

// prettier-ignore
const p3 = [
  [1, ],
  [0, ],
  [1, ],
  [1, ],
];

export const choreography = [
  repeat([p2, p3, p3, p3], 4).flat(),
  // repeat(p2, 16),
  // repeat([p2, p3], 4).flat(),
  // repeat(p2, 16),
].flat();

/** A microbe that swims automatically to a beat */
export class AutoMicrobe extends Microbe {
  actions = [this.idle, this.swim, () => (this.newCenter(), this.swim())];

  constructor(
    pos: LJS.Vector2,
    leader?: Microbe | undefined,
    number = 0,
    beat = globalBeat
  ) {
    super(pos, leader, number, beat);

    this.beat.onpattern(
      choreography,
      (note) => note !== undefined && this.actions.at(note)?.call(this),
      BarSequencing.Loop
    );
  }
}
