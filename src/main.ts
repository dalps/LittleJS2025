"use strict";

// import LittleJS module
import * as LJS from "littlejsengine";
import { Microbe } from "./entities/microbe";
import { Player } from "./entities/player";
import { AutoMicrobe } from "./entities/microbe_auto";
import { Beat } from "./beat";
import { sfx } from "./sfx";
const { vec2, rgb, tile, time } = LJS;

export const spriteAtlas: Record<string, LJS.TileInfo> = {};
let player: Microbe;

let bubbles = [];
let autoMicrobes = [];
export let globalBeat: Beat;

export const bpm = 60;
export const tileSize = vec2(100);

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

  player = new Player(startPos);

  player.idle();

  globalBeat = new Beat(60, 4, 2);

  globalBeat.onbeat(([b, s]) => {
    sfx.tic.play(undefined, 0.5, s === 0 ? 2 : 1);
  });

  for (let i = 0; i < 100; i++) {
    const pos = LJS.randInCircle(100, 0);
    autoMicrobes.push(new AutoMicrobe(pos));
  }

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

const FONT = "Averia Sans Libre";
///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects

  const rBeat = 0.5;
  const rSub = 0.3;
  const mBeat = 3;
  const mSub = mBeat / globalBeat.subs;
  const lineWidth = 0.1;
  const color = LJS.rgb(1, 1, 0, 0.5);

  // LJS.drawCircle(
  //   LJS.cameraPos.add(vec2(globalBeat.beatCount * mBeat, -10)),
  //   rBeat,
  //   LJS.YELLOW
  // );

  // LJS.drawCircle(
  //   LJS.cameraPos
  //     .add(vec2(globalBeat.beatCount * mBeat, -10))
  //     .add(vec2(globalBeat.subCount * mSub, 0)),
  //   rSub,
  //   LJS.YELLOW
  // );

  LJS.drawText(
    "The mitochondrion is the partyhouse of the cell",
    vec2(0.5, 0.5),
    1,
    LJS.WHITE,
    undefined,
    undefined,
    "center",
    FONT
  );

  for (
    let i = 0, pi = LJS.cameraPos.subtract(vec2(0, 10));
    i < globalBeat.beats;
    i++, pi = pi.add(vec2(mBeat, 0))
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
      FONT
    );

    for (
      let j = 0, pj = pi.add(vec2(mSub, 0));
      j < globalBeat.subs - 1;
      j++, pj = pj.add(vec2(mSub, 0))
    ) {
      LJS.drawCircle(pj, rSub, i === globalBeat.beatCount && j + 1 === globalBeat.subCount ? LJS.YELLOW : color);
    }
  }
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
