/*
    Little JS Hello World Demo
    - Just prints 'Hello World!'
    - A good starting point for new projects
*/

"use strict";

// import LittleJS module
import * as LJS from "littlejsengine";
import { Microbe, tileSize } from "./entities/microbe";
import { Player } from "./entities/player";
const { vec2, rgb, tile } = LJS;

export const spriteAtlas: Record<string, LJS.TileInfo> = {};
let player: Microbe;

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  // LJS.setCanvasFixedSize(vec2(1000));
  // LJS.setCanvasPixelated(false);

  // init textures
  spriteAtlas["swim"] = tile(0, tileSize);
  spriteAtlas["idle"] = tile(10, tileSize); // tile(15, vec2(200,200));
  spriteAtlas["bubble"] = tile(0, tileSize, 1);

  const startPos = vec2(0.5, 0.5);

  player = new Player(startPos);

  player.idle();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state
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
  ["frames.png", "objects.png"]
);
