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

  // init textures
  ["swim", "idle", "bump"].forEach((animKey, idx) => {
    spriteAtlas[animKey] = tile(vec2(0, idx), tileSize);

    spriteAtlas[`${animKey}_tummy`] = tile(vec2(0, idx), tileSize, 1);
  });

  spriteAtlas["bubble"] = tile(0, tileSize, 2);

  const startPos = vec2(0.5, 0.5);

  player = new Player(startPos);

  player.idle();

  globalBeat = new Beat(60, 4, 1);

  globalBeat.onbeat(([b]) => {
    sfx.tic.play(undefined, 0.5, b === 0 ? 2 : 1);
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

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
  // LJS.drawTextScreen("Hello World!", LJS.mainCanvasSize.scale(0.5), 80);
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
