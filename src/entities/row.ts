import { vec2 } from "littlejsengine";
import { PatternWrapping } from "../beat";
import { currentSong } from "../main";
import { DEG2RAD, polar, type Maybe } from "../mathUtils";
import { Tween } from "../tween";
import { Microbe } from "./microbe";
import { Player } from "./player";

export let row: Microbe[] = [];
export let leader: Maybe<Microbe>;
export let player: Maybe<Player>;

export function makeRow({
  angleDelta = 35 * DEG2RAD,
  startAngle = 0,
  startDist = 5,
  playerIdx = -1,
  length = 3,
  wrapping = PatternWrapping.End,
} = {}) {
  clearRow();

  leader = new Microbe(vec2(startAngle, startDist), {
    rowIdx: 0,
    song: currentSong,
    wrapping,
  });
  row.push(leader);

  for (let rowIdx = 1; rowIdx < length; rowIdx++) {
    const startPos = polar(startAngle + angleDelta * -rowIdx, startDist);
    const opts = {
      leader,
      rowIdx: rowIdx,
      song: currentSong,
      wrapping,
    };
    const m =
      rowIdx === playerIdx
        ? (player = new Player(startPos, opts))
        : new Microbe(startPos, opts);

    row.push(m);
  }

  // blink indefinitely
  row.forEach((m) =>
    new Tween((t) => t === 1 && m.wink(), 0, 1, 360).then(Tween.Loop)
  );

  return row;
}

export function clearRow() {
  row.forEach((m) => m.destroy());
  row.splice(0);
  player = leader = undefined;
}
