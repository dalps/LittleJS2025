"use strict";

// import LittleJS module
import * as LJS from "littlejsengine";
import { Beat } from "./beat";
import type { Microbe } from "./entities/microbe";
import { AutoMicrobe } from "./entities/microbe_auto";
import { Player } from "./entities/player";
import { DEG2RAD, polar, rgba } from "./mathUtils";
import { Metronome } from "./metronome";
import { songs } from "./music";
import { Ease, Tween } from "./tween";
import {
  colorPickerBtn,
  createPauseMenu,
  createStartMenu,
  pauseMenu,
  quitBtn,
  resumeBtn,
  startBtn,
} from "./ui";
const { vec2, rgb, tile, time } = LJS;

export let pauseBtn: LJS.UIObject;

enum GameState {
  Loading,
  AwaitClick,
  Title,
  Game,
  Paused,
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
let autoMicrobes: Microbe[] = [];

export let titleMenu: LJS.UIObject;
let loadingBtn: LJS.UIButton;
let textColor = rgba(0, 0, 0, 1);
let leader: AutoMicrobe | undefined;
let foregroundCausticPos: LJS.Vector2 = vec2();
let backgroundCausticPos: LJS.Vector2 = vec2();

function loadAssets() {
  // init textures
  ["swim", "idle", "bump"].forEach((animKey, idx) => {
    spriteAtlas[animKey] = tile(vec2(0, idx), tileSize);

    spriteAtlas[`${animKey}_tummy`] = tile(vec2(0, idx), tileSize, 1);
  });

  spriteAtlas["bubble"] = tile(0, tileSize, 2);
  titleSong = new LJS.SoundWave(songs[currentSong].filename);

  titleMenu = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));
  let title = new LJS.UIText(
    vec2(0, -100),
    vec2(900, 90),
    "Small Row",
    "center"
  );
  let subtitle = new LJS.UIText(
    vec2(0, 70),
    vec2(900, 20),
    "Rhythm Heaven copycat · made for LittleJS 2025",
    "center"
  );

  title.textLineColor = LJS.WHITE;
  title.textLineWidth = 2;
  title.textColor = subtitle.textColor = LJS.WHITE;

  title.addChild(subtitle);
  titleMenu.addChild(title);

  loadingBtn = new LJS.UIButton(
    LJS.mainCanvasSize.multiply(vec2(0.5, 0.8)),
    LJS.mainCanvasSize,
    "",
    rgba(0, 0, 0, 0)
  );
  loadingBtn.lineWidth = 0;
  loadingBtn.hoverColor = LJS.CLEAR_WHITE;
  loadingBtn.textColor = LJS.WHITE.copy();
  loadingBtn.textHeight = 42;
  center = LJS.mainCanvasSize.scale(0.5);
}

// After loading finishes, await the user's click. This is essential to play
// music in the title screen
function awaitClick() {
  gameState = GameState.AwaitClick;

  new Tween((t) => (loadingBtn.textColor.a = t), 1, 0.1, 10) //
    .then(() => {
      loadingBtn.text = "Click to start";
      new Tween((t) => (loadingBtn.textColor.a = t), 0, 1, 30) //
        .then(Tween.PingPong);
      // .setEase(
      //   Ease.PIECEWISE(
      //     () => 0,
      //     () => 1
      //   )
      // );
    });

  loadingBtn.interactive = true;

  loadingBtn.onClick = () => {
    loadingBtn.destroy();
    new Tween(
      (t) =>
        LJS.setCanvasClearColor(
          LJS.canvasClearColor.lerp(rgba(5, 52, 106, 1), t)
        ),
      0,
      1,
      20
    ).setEase(Ease.OUT(Ease.BOUNCE));
    titleScreen();
  };
}

function makeRow({
  angleDelta = 35 * DEG2RAD,
  startAngle = 0,
  startDist = 5,
  playerIdx = -1,
  length = 3,
} = {}) {
  leader = new AutoMicrobe(vec2(0, startDist));
  autoMicrobes.push(leader);

  for (let i = 1; i < length; i++) {
    const startPos = polar(startAngle + angleDelta * -i, startDist);
    const m =
      i === playerIdx
        ? (player = new Player(startPos, leader, i))
        : new AutoMicrobe(startPos, leader, i);

    autoMicrobes.push(m);
  }
}

function clearRow() {
  autoMicrobes.forEach((m) => m.destroy());
  leader = undefined;
}

function titleScreen() {
  gameState = GameState.Title;

  pauseMenu.visible = false;
  titleMenu.visible = true;

  createStartMenu();

  startBtn.onClick = startGame;

  globalBeat = new Beat(songs[currentSong].bpm, 4, 1);

  LJS.setTouchInputEnable(true);
  LJS.setSoundVolume(0);

  makeRow();

  // prettier-ignore
  matrixParticles = new LJS.ParticleEmitter(vec2(), 0, 100, 0, 10, 3.14, spriteAtlas["bubble"], new LJS.Color(1, 1, 1, 1), new LJS.Color(1, 1, 1, 1), new LJS.Color(0.439, 0.973, 0.361, 0), new LJS.Color(1, 1, 1, 0), 4.3, 0.2, 1, 0, 0, 1, 1, 0, 0, 0, 0, false, true, false, -1e4, false);

  autoMicrobes[1].addChild(matrixParticles);

  for (let i = 0; i < 100; i++) {
    const size = vec2(1).scale(LJS.rand(1, 5));
    const pos = LJS.randInCircle(100, 0);
    bubbles.push({ size, pos });
  }

  globalBeat.play();
}

function startGame() {
  pauseBtn = new LJS.UIButton(
    LJS.mainCanvasSize.multiply(vec2(0.9, 0.1)),
    vec2(50, 50),
    "||"
  );

  pauseBtn.onClick = () => {
    gameState = GameState.Paused;

    pauseMenu.visible = true;
    pauseBtn.visible = false;
    globalBeat.stop();
  };

  quitBtn.onClick = () => {
    clearRow();
    metronome.destroy();
    titleScreen();
  };

  resumeBtn.onClick = () => {
    gameState = GameState.Game;

    pauseMenu.visible = false;
    pauseBtn.visible = true;
    globalBeat.play();
  };

  clearRow();
  makeRow({ playerIdx: 1 });
  player.color = colorPickerBtn.color;

  titleMenu.visible = false;

  const metronomePos = LJS.mainCanvasSize.multiply(vec2(0.5, 0.1));
  metronome = new Metronome(metronomePos, globalBeat);

  gameState = GameState.Game;
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  new LJS.UISystemPlugin();
  // new LJS.PostProcessPlugin(tvShader);

  LJS.setFontDefault(font);
  LJS.uiSystem.defaultFont = font;

  createPauseMenu();
  pauseMenu.visible = false;

  loadAssets();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  switch (gameState) {
    case GameState.Loading:
      // if (titleSong.isLoaded())
      awaitClick();
      break;
    case GameState.Title:
      LJS.setCameraPos(LJS.cameraPos.add(LJS.keyDirection()));
      // LJS.setCameraPos(autoMicrobes[1].pos);
      break;
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

    case GameState.Game:
    case GameState.Title:
      const t = LJS.timeReal * 0.3;
      LJS.drawTile(
        LJS.cameraPos.scale(0.7).add(vec2(-LJS.cos(t), LJS.sin(-t))),
        vec2(LJS.mainCanvasSize.scale(0.1).x),
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
  const t = LJS.timeReal * 0.1;
  // called after objects are rendered
  // draw effects or hud that appear above all objects
  LJS.drawTile(
    LJS.cameraPos.scale(0.9).add(vec2(LJS.cos(t), LJS.sin(t))),
    vec2(LJS.mainCanvasSize.scale(0.1).x),
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
