import * as LJS from "littlejsengine";
import { cameraZoom, changeBackground, pulse, shake, sleep } from "./animUtils";
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
  vignette,
} from "./main";
import { LOG, rgba, setAlpha, setHSLA } from "./mathUtils";
import type { Song } from "./music";
import { sfx } from "./sfx";
import {
  myFirstConsole,
  myFirstConsoleTutorial,
  stardustMemories,
  woodenShoes,
} from "./songs";
import { tutorial, tutorialMessage } from "./tutorial";
import { Ease, Tween } from "./tween";
import { colorPickerBtn, IconButton, pauseMenu, quitBtn } from "./ui";
import { uitext } from "./uiUtils";
const { vec2, rgb, tile } = LJS;

export let pauseBtn: LJS.UIObject;
export let levelsMessage: LJS.UIText;

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

  locked = true;
  lockMessage: string;
  unlockFn: () => boolean;

  private _highScore = 0;

  public get highScore(): number {
    const storedValue = localStorage.getItem(this.getStoreKey("highScore"));
    return (storedValue && Number.parseFloat(storedValue)) || this._highScore;
  }

  public set highScore(value: number) {
    this._highScore = value;
    LOG(`Setting highScore for ${this.name} to ${value}`);
    localStorage.setItem(this.getStoreKey("highScore"), `${value}`);
  }

  onClick?: Function;
  onEnd?: Function;

  // ui
  btn?: LJS.UIButton;
  scoreText?: LJS.UIText;
  completedTile?: LJS.UITile;
  lockedTile?: LJS.UITile;
  color: LJS.Color;

  constructor(
    public name: string,
    public song: Song,
    { locked = true, lockMessage = "", unlockFn = () => false } = {}
  ) {
    this.color = song.color;
    this.locked = locked;
    this.lockMessage = lockMessage;
    this.unlockFn = unlockFn;

    this.completed =
      localStorage.getItem(this.getStoreKey("completed")) === "true";
  }

  getStoreKey = (...parts: (keyof this)[]) =>
    storeKey(this.name, ...parts.map((p) => p.toString()));

  show(pos = center) {
    let btn = this.btn;

    if (!btn) {
      // init UI
      btn = new LJS.UIButton(pos, levelBtnSize, this.name, this.color);

      this.btn = btn;
      levelsMenu.addChild(btn);

      btn.cornerRadius = 5;
      btn.textWidth = btn.size.x - 10;
      btn.textHeight = 30;
      btn.shadowColor = setAlpha(LJS.BLACK, 0.5);
      btn.shadowBlur = 10;
      btn.shadowOffset = vec2(0, 10);
      btn.textShadow = vec2(0, 2);
      btn.textOffset = vec2(0, -20);

      btn.addChild(
        (this.completedTile = new LJS.UITile(
          levelBtnSize.multiply(vec2(0.5)).subtract(vec2(20)),
          vec2(20),
          spriteAtlas.check
        ))
      );

      btn.addChild(
        (this.scoreText = uitext("", {
          pos: vec2(0, 50),
          fontSize: 30,
        }))
      );

      btn.addChild(
        (this.lockedTile = new LJS.UITile(vec2(), vec2(50), spriteAtlas.lock))
      );

      this.lockedTile.interactive = this.lockedTile.canBeHover = true;
      this.lockedTile.shadowColor = setAlpha(LJS.BLACK, 0.5);
      this.lockedTile.shadowOffset = vec2(0, 5);
      this.lockedTile.color = LJS.GRAY;
    }

    if ((this.locked = this.unlockFn())) {
      this.lockedTile!.onClick = btn.onClick = () => {
        shake(btn.localPos);
        levelsMessage.text = this.lockMessage;
        return;
      };

      btn.color = btn.hoverColor = setHSLA(this.color, {
        s: 0.5,
        l: 0.2,
      });
      btn.textColor = rgba(115, 115, 115, 1);
      btn.lineColor = setHSLA(this.color, { s: 0.5, l: 0.1 });
    } else {
      btn.onClick = () => {
        hideLevels();
        levelsMenu.visible = false;
        this.start();
      };

      btn.color = this.color;
      btn.hoverColor = setHSLA(this.color, { s: 0.5, l: 0.4 });
      btn.textColor = LJS.WHITE;
      btn.lineColor = setHSLA(this.color, { s: 0.5, l: 0.6 });
    }

    btn.visible = true;
    this.scoreText!.visible = !this.locked;
    this.lockedTile!.visible = this.locked;
    this.completedTile!.visible = this.completed;
    this.highScore !== undefined &&
      (this.scoreText!.text = `${Math.round(this.highScore * 100)}%`);
  }

  hide() {
    if (this.btn) this.btn.visible = false;
  }

  load() {}

  async start() {
    // currentSong.stop();

    await vignette.fade({ duration: 60 });

    setGameState(GameState.Game);

    setCurrentSong(this.song);
    currentSong.onEnd = this.end.bind(this);

    let [_, player] = makeRow({ playerIdx: 1 });
    player.color = colorPickerBtn.color;

    titleText.visible = titleMenu.visible = false;
    pauseBtn.visible = true;

    changeBackground(this.color);

    await vignette
      .circleMask({
        endRadius: LJS.mainCanvasSize.x,
      })
      .setEase(Ease.POWER(5));

    currentSong.addMetronome();
    currentSong.play();
  }

  async end() {
    setGameState(GameState.GameResults);

    currentSong.stop();
    currentSong.hide();
    let finalScore = currentSong.getFinalScore();

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
    cameraZoom({ delta: -2 });
    currentSong.metronome.hide();

    sfx.blink.play(undefined, 1);

    // const scoreTimerDelta = 1 / LJS.lerp(3, 10, finalScore);
    // let scoreTimer = new LJS.Timer(scoreTimerDelta);

    // tally up the score
    await sleep(100);

    let prevT = 0;
    await new Tween(
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
    );

    // show rating
    await sleep(100);
    sfx.blink.play(undefined, 1, LJS.clamp(1 + finalScore, 0, 2));

    const { message, color1, color2 } = Object.values(ratings).find(
      ({ threshold }) => threshold <= finalScore
    )!;

    this.completed = finalScore >= ratings.ok.threshold;
    this.highScore = Math.max(this.highScore, finalScore);

    ratingText.visible = true;
    ratingText.text = message;
    ratingText.textColor = color1;
    ratingText.textLineColor = color2;

    await sleep(100);
    backToTitleBtn.visible = true;
    pulse(backToTitleBtn.textColor);
  }
}

export const levelBtnSize = vec2(150, 200);
export const levelBtnSpacing = levelBtnSize.scale(1.2);

export let LEVELS: Level[] = [];
export let tutorialLevel: Level;
export let levelSM: Level;
export let levelMFC: Level;
export let levelWS: Level;

export function initLevels() {
  tutorialLevel = new Level("Tutorial", myFirstConsoleTutorial, {
    locked: false,
  });
  tutorialLevel.start = tutorial; // overrides default behavior
  tutorialLevel.highScore = undefined; // don't show this stat for tutorial

  const printRequirement = (lvlname: string) =>
    `Get a rhythm score of at least 50%\nin ${lvlname.replace("\n", " ")}`;

  levelSM = new Level("Stardust\nMemories", stardustMemories, {
    lockMessage: `Do the tutorial!`,
    unlockFn: () => !tutorialLevel.completed,
  });
  levelMFC = new Level("My First\nConsole", myFirstConsole, {
    // just pass a whole level as a prerequisite instead of these
    lockMessage: printRequirement(levelSM.name),
    unlockFn: () => !levelSM.completed,
  });
  levelWS = new Level("Wooden\nShoes", woodenShoes, {
    lockMessage: printRequirement(levelMFC.name),
    unlockFn: () => !levelMFC.completed,
  });

  LEVELS.push(
    tutorialLevel, //
    levelSM,
    levelMFC,
    levelWS
  );
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

  const levelsText = uitext("Levels", { pos: vec2(0, -160), fontSize: 70 });

  levelsMenu.addChild(levelsText);
  levelsMenu.addChild(
    (levelsMessage = uitext("", {
      pos: vec2(0, 180),
      fontSize: 20,
    }))
  );

  levelsMessage.shadowColor = levelsText.shadowColor = setAlpha(LJS.BLACK, 0.5);
  levelsMessage.shadowOffset = levelsText.shadowOffset = vec2(0, 5);

  // shared by all levels
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
        tutorialMessage && (tutorialMessage.visible = false);

        changeBackground(LJS.BLACK);
        cameraZoom({ delta: -2, duration: 100 });

        currentSong.pause();
      },
    }
  );

  quitBtn.onClick = titleScreen;

  // resumeBtn.onClick = () => {
  //   setGameState(GameState.Game);

  //   pauseMenu.visible = false;
  //   pauseBtn.visible = true;

  //   changeBackground();
  //   cameraZoom({ delta: 2 });

  //   currentSong.resume();
  // };

  pauseBtn.visible = pauseMenu.visible = false;
}

export const showLevels = () => {
  let startPos = levelBtnSpacing.multiply(vec2(-(LEVELS.length - 1) * 0.5, 0));

  LEVELS.forEach((lvl) => {
    lvl.show(startPos);
    startPos = startPos.add(vec2(levelBtnSpacing.x, 0));
  });

  levelsMessage.text = "Stay tuned for more levels!";
};

export const hideLevels = () => LEVELS.forEach((lvl) => lvl.hide());
