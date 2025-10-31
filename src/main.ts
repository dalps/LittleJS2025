"use strict";

// import LittleJS module
import * as LJS from "littlejsengine";
import { Beat } from "./beat";
import { AutoMicrobe } from "./entities/microbe_auto";
import { Player } from "./entities/player";
import { DEG2RAD, polar, rgba } from "./mathUtils";
import { Metronome } from "./metronome";
import { songs } from "./music";
import { Ease, Tween } from "./tween";
import { colorPickerBtn, createTitleUI, startBtn } from "./ui";
import type { Microbe } from "./entities/microbe";
const { vec2, rgb, tile, time } = LJS;

enum GameState {
  Loading,
  AwaitClick,
  Title,
  Game,
}

export let globalBeat: Beat;
export let metronome: Metronome;
export let titleSong: LJS.SoundWave;
export let musicInstance: LJS.SoundInstance;
export let gameState: GameState = GameState.Loading;
export let currentSong: keyof typeof songs = "stardustMemories";

export const spriteAtlas: Record<string, LJS.TileInfo> = {};
export const font = "Averia Sans Libre";
export const tileSize = vec2(100);
export const angleDelta = 35 * DEG2RAD;
export let center: LJS.Vector2;

let matrixParticles: LJS.ParticleEmitter;
let musicVolume = 1;
let musicLoaded = false;
let percentLoaded = 0;
let player: Player;
let bubbles: {} = [];
let autoMicrobes: AutoMicrobe[] = [];

let loadingBtn: LJS.UIButton;
let textColor = rgba(0, 0, 0, 1);
let leader: AutoMicrobe | undefined;

function loadAssets() {
  // init textures
  ["swim", "idle", "bump"].forEach((animKey, idx) => {
    spriteAtlas[animKey] = tile(vec2(0, idx), tileSize);

    spriteAtlas[`${animKey}_tummy`] = tile(vec2(0, idx), tileSize, 1);
  });

  spriteAtlas["bubble"] = tile(0, tileSize, 2);
  titleSong = new LJS.SoundWave(songs[currentSong].filename);

  loadingBtn = new LJS.UIButton(
    LJS.mainCanvasSize.multiply(vec2(0.5)),
    vec2(1000, 50),
    "",
    rgba(0, 0, 0, 0)
  );
  loadingBtn.lineWidth = 0;
  loadingBtn.hoverColor = LJS.CLEAR_WHITE;
  loadingBtn.textColor = LJS.WHITE.copy();
  center = LJS.mainCanvasSize.scale(0.5);
}

// After loading finishes, await the user's click. This is essential to play
// music in the title screen
function awaitClick() {
  gameState = GameState.AwaitClick;

  new Tween((t) => (loadingBtn.textColor.a = t), 0.1, 1, 100).then(
    Tween.PingPong
  );

  loadingBtn.text = "Click to start";
  loadingBtn.interactive = true;

  loadingBtn.onClick = () => {
    loadingBtn.destroy();
    titleScreen();
  };
}

function makeRow({
  angleDelta = 35 * DEG2RAD,
  startAngle = 0,
  startDist = 5,
  playerIdx = 1,
  length = 3,
} = {}) {
  leader = new AutoMicrobe(vec2(0, startDist));
  autoMicrobes.push(leader);

  for (let i = 1; i < length; i++) {
    const m = new AutoMicrobe(
      polar(startAngle + angleDelta * -i, startDist),
      leader,
      i
    );
    if (i === playerIdx) player = m;
    autoMicrobes.push(m);
  }
}

function clearRow() {
  autoMicrobes.forEach((m) => m.destroy());
  leader = undefined;
}

function titleScreen() {
  gameState = GameState.Title;
  createTitleUI();

  startBtn.onClick = startGame;

  globalBeat = new Beat(songs[currentSong].bpm, 4, 1);

  const metronomePos = LJS.mainCanvasSize.multiply(vec2(0.5, 0.1));
  metronome = new Metronome(metronomePos, globalBeat);

  LJS.setTouchInputEnable(true);
  LJS.setSoundVolume(0);

  LJS.setCanvasClearColor(rgba(5, 52, 106, 1));

  makeRow();

  // prettier-ignore
  matrixParticles = new LJS.ParticleEmitter(vec2(), 0, 100, 0, 10, 3.14, spriteAtlas["bubble"], new LJS.Color(1, 1, 1, 1), new LJS.Color(1, 1, 1, 1), new LJS.Color(0.439, 0.973, 0.361, 0), new LJS.Color(1, 1, 1, 0), 4.3, 0.2, 1, 0, 0, 1, 1, 0, 0, 0, 0, false, true, false, -1e4, false);

  player.addChild(matrixParticles);

  for (let i = 0; i < 100; i++) {
    const size = vec2(1).scale(LJS.rand(1, 5));
    const pos = LJS.randInCircle(100, 0);
    bubbles.push({ size, pos });
  }

  globalBeat.play();
}

function startGame() {
  autoMicrobes.forEach((m) => m.destroy());

  makeRow();
  player = new Player(vec2(-angleDelta, 2), leader!, 1);
  player.color = colorPickerBtn.color;
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  new LJS.UISystemPlugin();
  // new LJS.PostProcessPlugin(tvShader);

  LJS.setFontDefault(font);
  LJS.uiSystem.defaultFont = font;

  loadAssets();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  switch (gameState) {
    case GameState.Loading:
      if (titleSong.isLoaded()) awaitClick();
      break;
    case GameState.Title:
    case GameState.Game:
      // LJS.setCameraPos(LJS.cameraPos.add(LJS.keyDirection()));
      LJS.setCameraPos(player.pos);
      break;
  }
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
  switch (gameState) {
    case GameState.Loading:
      const loadedPercent = (titleSong.loadedPercent * 100) | 0;
      loadingBtn.text = `Loading music: ${loadedPercent}%`;
      break;

    case GameState.Title:
      const t = LJS.timeReal * 0.3;
      LJS.drawTile(
        LJS.cameraPos.scale(0.7).add(vec2(-LJS.cos(t), LJS.sin(-t))),
        LJS.mainCanvasSize.scale(0.1),
        tile(vec2(), vec2(512), 3),
        rgba(
          255,
          255,
          255,
          LJS.lerp(0.2, 0.5, 0.5 - LJS.cos(LJS.timeReal) * 0.5)
        ),
        0,
        false,
        rgba(
          0,
          119,
          255,
          LJS.lerp(0.02, 0.05, 0.5 - LJS.cos(LJS.timeReal + Math.PI) * 0.5)
        )
      );
      bubbles.forEach(({ pos, size }) =>
        LJS.drawTile(pos, size, spriteAtlas["bubble"])
      );
      break;
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
  LJS.drawTile(
    LJS.cameraPos
      .scale(0.9)
      .add(vec2(LJS.cos(LJS.timeReal * 0.1), LJS.sin(LJS.timeReal * 0.1))),
    LJS.mainCanvasSize.scale(0.1),
    tile(vec2(), vec2(512), 3),
    rgba(
      255,
      255,
      255,
      LJS.lerp(0.2, 0.5, 0.5 - LJS.cos(LJS.timeReal + Math.PI) * 0.5)
    ),
    Math.PI,
    false,
    rgba(
      0,
      119,
      255,
      LJS.lerp(0.02, 0.05, 0.5 - LJS.cos(LJS.timeReal + Math.PI) * 0.5)
    )
  );
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
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
LJS.engineInit(
  gameInit,
  gameUpdate,
  gameUpdatePost,
  gameRender,
  gameRenderPost,
  ["frames.png", "frames_tummy.png", "objects.png", "caustic4.png"]
);
