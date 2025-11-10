import * as LJS from "littlejsengine";
import type { Song } from "./music";
import {
  myFirstConsoleTutorial,
  paarynasAllrite,
  stardustMemories,
} from "./songs";
import {
  center,
  clearRow,
  currentSong,
  GameState,
  makeRow,
  ratings,
  setCurrentSong,
  setGameState,
  spriteAtlas,
  titleMenu,
  titleScreen,
  titleText,
} from "./main";
import { cameraZoom, changeBackground, pulse, sleep } from "./animUtils";
import {
  colorPickerBtn,
  IconButton,
  pauseMenu,
  quitBtn,
  resumeBtn,
} from "./ui";
import { uitext } from "./uiUtils";
import { LOG, rgba, setAlpha } from "./mathUtils";
import { tutorial } from "./tutorial";
import { sfx } from "./sfx";
import { Tween } from "./tween";
const { vec2, rgb, tile } = LJS;

export let pauseBtn: LJS.UIObject;

export const storeKeyPrefix = `dalps-smallrow`;
export const storeKey = (
  ...parts: string[]
): `${typeof storeKeyPrefix}-${string}` =>
  `${storeKeyPrefix}-${parts.join("-")}`;

export class Level {
  private _completed = false;
  public get completed(): boolean {
    return this._completed;
  }
  public set completed(value: boolean) {
    this._completed = value;
    localStorage.setItem(this.getStoreKey("completed"), `${value}`);
  }

  private _highScore = 0;
  public get highScore(): number {
    return this._highScore;
  }
  public set highScore(value: number) {
    this._highScore = value;
    localStorage.setItem(this.getStoreKey("highScore"), `${value}`);
  }

  onClick?: Function;
  onEnd?: Function;
  btn?: LJS.UIButton;
  color: LJS.Color;

  getStoreKey = (...parts: (keyof this)[]) =>
    storeKey(this.name, ...parts.map((p) => p.toString()));

  constructor(public name: string, public song: Song) {
    this.color = song.color;
    this.highScore = Number.parseInt(
      localStorage.getItem(this.getStoreKey("highScore")) ?? "0"
    );
    this.completed =
      localStorage.getItem(this.getStoreKey("completed")) === "true";
  }

  show(pos = center) {
    this.btn = new LJS.UIButton(pos);
  }

  load() {}

  start() {
    setCurrentSong(this.song);

    currentSong.addMetronome();
    currentSong.onEnd = this.end.bind(this);
    currentSong.play();

    let [_, player] = makeRow({ playerIdx: 1 });
    player.color = colorPickerBtn.color;

    titleText.visible = titleMenu.visible = false;

    setGameState(GameState.Game);

    // LOG(`Starting game...`);
    changeBackground(this.color);

    pauseBtn = new IconButton(
      LJS.mainCanvasSize.multiply(vec2(0.9, 0.1)),
      "pause",
      {
        btnSize: vec2(50),
        iconSize: vec2(30),
        iconColor: LJS.BLACK,
        onClick: () => {
          setGameState(GameState.Paused);

          pauseMenu.visible = true;
          pauseBtn.visible = false;

          changeBackground(LJS.BLACK);
          cameraZoom({ delta: -2, duration: 100 });

          currentSong.pause();
        },
      }
    );

    quitBtn.onClick = () => {
      clearRow();
      player.destroy();
      titleScreen();
    };

    // resumeBtn.onClick = () => {
    //   setGameState(GameState.Game);

    //   pauseMenu.visible = false;
    //   pauseBtn.visible = true;

    //   changeBackground();
    //   cameraZoom({ delta: 2 });

    //   currentSong.resume();
    // };
  }

  end() {
    setGameState(GameState.GameResults);

    currentSong.hide();
    let finalScore = currentSong.getFinalScore();
    LOG(`finalScore: ${finalScore}`);

    let resultsObj = new LJS.UIObject(
      LJS.mainCanvasSize.scale(0.5),
      vec2(580, 300)
    );
    let title = new LJS.UIText(vec2(0, -100), vec2(1000, 60), `Rhythm score:`);

    title.textColor = rgba(217, 217, 217, 1);

    let scoreText = new LJS.UIText(vec2(), vec2(200, 72), `0%`);
    let ratingText = new LJS.UIText(vec2(100), vec2(200, 48), ``);
    let backToTitleBtn = new LJS.UIButton(
      vec2(0, 250),
      LJS.mainCanvasSize,
      "Back to title",
      rgba(0, 0, 0, 0)
    );

    resultsObj.color = setAlpha(LJS.BLACK, 0.5);
    resultsObj.cornerRadius = 50;
    resultsObj.lineColor = LJS.YELLOW;
    resultsObj.lineWidth = 10;
    resultsObj.shadowOffset = vec2(20);
    resultsObj.shadowBlur = 10;
    resultsObj.shadowColor = setAlpha(LJS.BLACK, 0.5);

    backToTitleBtn.visible = false;

    backToTitleBtn.onClick = () => {
      resultsObj.destroy();
      currentSong.stop();
      titleScreen();
    };
    backToTitleBtn.lineWidth = 0;
    backToTitleBtn.hoverColor = LJS.CLEAR_WHITE;
    backToTitleBtn.textColor = LJS.WHITE.copy();
    backToTitleBtn.textHeight = 42;

    pauseBtn.visible = false;

    resultsObj.addChild(backToTitleBtn);
    resultsObj.addChild(title);
    resultsObj.addChild(scoreText);
    resultsObj.addChild(ratingText);

    ratingText.visible = false;
    ratingText.textLineWidth = 5;
    scoreText.textColor = ratingText.textColor = LJS.WHITE;

    // const between = (value: number, a: number, b: number) =>
    //   a < value && value <= b;

    changeBackground(LJS.BLACK);
    currentSong.metronome.hide();

    sfx.blink.play(undefined, 1);

    // const scoreTimerDelta = 1 / LJS.lerp(3, 10, finalScore);
    // let scoreTimer = new LJS.Timer(scoreTimerDelta);

    let prevT = 0;

    // tally up the score
    sleep(100).then(() =>
      new Tween(
        (t) => {
          // play beep sound with pitch function of t
          let intT = (t * 100) >> 0;
          if (intT > prevT) {
            sfx.blink.play(undefined, 0.5, LJS.clamp(1 + t, 0, 2));
            scoreText.text = `${intT}%`;
            prevT = intT;
          }
        },
        0,
        finalScore,
        LJS.lerp(100, 250, finalScore) >> 0
      ).then(() => {
        sleep(100).then(() => {
          // show rating
          sfx.blink.play(undefined, 1, LJS.clamp(1 + finalScore, 0, 2));

          const { message, color1, color2 } = Object.values(ratings).find(
            ({ threshold }) => threshold <= finalScore
          )!;

          this.completed = finalScore >= ratings.ok.threshold;
          this.highScore = LJS.max(this.highScore ?? 0, finalScore);

          ratingText.visible = true;
          ratingText.text = message;
          ratingText.textColor = color1;
          ratingText.textLineColor = color2;

          sleep(100).then(() => {
            backToTitleBtn.visible = true;
            pulse(backToTitleBtn.textColor);
          });
        });
      })
    );
  }

  save() {}
}

export const levelBtnSize = vec2(150, 200);
export const levelBtnSpacing = levelBtnSize.scale(1.2);

export let tutorialLevel: Level;
export let level1: Level;

export function initLevels() {
  tutorialLevel = new Level("Tutorial", myFirstConsoleTutorial);
  tutorialLevel.start = tutorial; // overrides default behavior
  tutorialLevel.highScore = undefined; // don't show this stat for tutorial
  level1 = new Level("Stardust\nMemories", stardustMemories);
}

export let levelsMenu: LJS.UIObject;

export function createLevelsMenu() {
  levelsMenu = new LJS.UIObject(center);

  let backToTitleBtn = new IconButton(center.scale(-1).add(vec2(60)), "play", {
    btnSize: vec2(50),
    iconAngle: Math.PI,
    iconColor: LJS.BLACK,
    onClick: () => {
      levelsMenu.visible = false;
      titleText.visible = titleMenu.visible = true;
    },
  });

  levelsMenu.addChild(backToTitleBtn);

  levelsMenu.addChild(uitext("Levels", { pos: vec2(0, -160), fontSize: 70 }));
  levelsMenu.addChild(
    uitext("More levels coming soon", { pos: vec2(0, 200), fontSize: 20 })
  );

  // level layout
  let levelsArr = [tutorialLevel, level1];
  let startPos = levelBtnSpacing.multiply(
    vec2(-(levelsArr.length - 1) * 0.5, 0)
  );

  levelsArr.forEach((lvl, idx) => {
    let btn = new LJS.UIButton(startPos, levelBtnSize, lvl.name, lvl.color);

    levelsMenu.addChild(btn);
    btn.textColor = LJS.WHITE;
    btn.onClick = () => {
      levelsMenu.visible = false;
      lvl.start();
    };
    btn.textFitScale = 0.5;
    btn.textHeight = 30;
    btn.shadowColor = setAlpha(LJS.BLACK, 0.5);
    btn.shadowBlur = 10;
    btn.shadowOffset = vec2(0, 10);
    btn.textShadow = vec2(0, 2);
    btn.textOffset = vec2(0, -20);
    btn.lineColor = lvl.color.copy().setHSLA(lvl.color.HSLA()[0], 0.5, 0.6);
    btn.hoverColor = lvl.color.copy().setHSLA(lvl.color.HSLA()[0], 0.5, 0.4);

    startPos = startPos.add(vec2(levelBtnSpacing.x, 0));

    if (lvl.completed)
      btn.addChild(
        new LJS.UITile(
          levelBtnSize.multiply(vec2(0.5)).subtract(vec2(20)),
          vec2(20),
          spriteAtlas["check"]
        )
      );

    if (lvl.highScore !== undefined)
      btn.addChild(
        uitext(`${Math.round(lvl.highScore * 100)}%`, {
          pos: vec2(0, 50),
          fontSize: 30,
        })
      );
  });
}
