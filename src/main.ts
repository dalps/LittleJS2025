"use strict";

// import LittleJS module
import * as LJS from "littlejsengine";
import { Microbe } from "./entities/microbe";
import { Player } from "./entities/player";
import { AutoMicrobe } from "./entities/microbe_auto";
import { Beat } from "./beat";
import { sfx } from "./sfx";
import { DEG2RAD } from "./mathUtils";
const { vec2, rgb, tile, time } = LJS;

export const spriteAtlas: Record<string, LJS.TileInfo> = {};
let player: Player;

let bubbles = [];
let autoMicrobes = [];
export let globalBeat: Beat;
let matrixParticles: LJS.ParticleEmitter;
export const font = "Averia Sans Libre";
export const spacingBeat = 2;
export const metronomeY = 10;
export const radiusBeat = 0.5;
export const radiusSubBeat = 0.3;
export const metronomeColor = LJS.rgb(1, 1, 0, 0.5);
export let spacingSubBeat: number;
export let metronomePos: LJS.Vector2;
export const bpm = 60;
export const tileSize = vec2(100);
export const angleDelta = 35 * DEG2RAD;

// prettier-ignore
export const metronomePatterns = [
  [
    [2,    ],
    [2,    ],
    [2,   1],
    [2,   1],
  ],
  [
    [2  , 1],
    [1.5, 1],
    [1.5, 1],
    [1.5, 1],
  ],
];

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  // LJS.setCanvasFixedSize(vec2(1000));
  // LJS.setCanvasPixelated(false);

  // init UI
  // new LJS.UISystemPlugin();

  // init textures
  ["swim", "idle", "bump"].forEach((animKey, idx) => {
    spriteAtlas[animKey] = tile(vec2(0, idx), tileSize);

    spriteAtlas[`${animKey}_tummy`] = tile(vec2(0, idx), tileSize, 1);
  });

  spriteAtlas["bubble"] = tile(0, tileSize, 2);

  const startPos = vec2(0.5, 0.5);

  const startDist = 5;

  autoMicrobes.push(new AutoMicrobe(angleDelta, startDist));
  player = new Player(angleDelta * 2, startDist);
  autoMicrobes.push(new AutoMicrobe(angleDelta * 3, startDist));

  player.idle();

  globalBeat = new Beat(60, 4, 2);
  spacingSubBeat = spacingBeat / (globalBeat.subs || 1);
  metronomePos = vec2(
    (spacingBeat * globalBeat.beats - spacingSubBeat) * 0.5,
    metronomeY
  );

  globalBeat.onbeat(([beat, sub, bar]) => {
    const note = metronomePatterns
      .at(bar > 0 ? 1 : 0)
      ?.at(beat)
      ?.at(sub);

    sfx.tic.play(undefined, note ? 0.5 : 0, note);
  });

  // prettier-ignore
  matrixParticles = new LJS.ParticleEmitter(vec2(), 0, 100, 0, 10, 3.14, spriteAtlas["bubble"], new LJS.Color(1, 1, 1, 1), new LJS.Color(1, 1, 1, 1), new LJS.Color(0.439, 0.973, 0.361, 0), new LJS.Color(1, 1, 1, 0), 4.3, 0.2, 1, 0, 0, 1, 1, 0, 0, 0, 0, false, true, false, -1e4, false);

  player.addChild(matrixParticles);

  for (let i = 0; i < 100; i++) {
    const size = vec2(1).scale(LJS.rand(1, 5));
    const pos = LJS.randInCircle(100, 0);
    bubbles.push({ size, pos });
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // update the beat timer
  globalBeat.update();

  LJS.setCameraPos(player.pos);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
  // called before objects are rendered
  // draw any background effects that appear behind objects
  bubbles.forEach(({ pos, size }) =>
    LJS.drawTile(pos, size, spriteAtlas["bubble"])
  );
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects

  const startPos = LJS.cameraPos.subtract(metronomePos);

  // LJS.drawText(
  //   "The mitochondrion is the partyhouse of the cell",
  //   vec2(0.5, 0.5),
  //   1,
  //   LJS.WHITE,
  //   undefined,
  //   undefined,
  //   "center",
  //   font
  // );

  for (
    let i = 0, pi = startPos;
    i < globalBeat.beats;
    i++, pi = pi.add(vec2(spacingBeat, 0))
  ) {
    // LJS.drawCircle(pi, rBeat, color);
    LJS.drawText(
      `${i + 1}`,
      pi,
      0.75,
      i === globalBeat.beatCount && globalBeat.subCount === 0
        ? LJS.YELLOW
        : LJS.BLUE,
      0.1,
      LJS.WHITE,
      "center",
      font
    );

    for (
      let j = 0, pj = pi.add(vec2(spacingSubBeat, 0));
      j < globalBeat.subs - 1;
      j++, pj = pj.add(vec2(spacingSubBeat, 0))
    ) {
      LJS.drawCircle(
        pj,
        radiusSubBeat,
        i === globalBeat.beatCount && j + 1 === globalBeat.subCount
          ? LJS.YELLOW
          : metronomeColor
      );
    }
  }

  // LJS.drawCircle(
  //   LJS.cameraPos
  //     .add(vec2(globalBeat.beatCount * mBeat, -10))
  //     .add(vec2(globalBeat.subCount * mSub, 0)),
  //   rSub,
  //   LJS.YELLOW
  // );
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
LJS.engineInit(
  gameInit,
  gameUpdate,
  gameUpdatePost,
  gameRender,
  gameRenderPost,
  ["frames.png", "frames_tummy.png", "objects.png"]
);
