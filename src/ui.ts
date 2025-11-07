import * as LJS from "littlejsengine";
import { font, titleObj } from "./main";
const { vec2, rgb, hsl } = LJS;

export let colorPickerMenu: LJS.UIObject;
export let colorPickerBtn: LJS.UIObject;
export let playerColor: LJS.Color;
export let startBtn: LJS.UIButton;

export function createStartMenu() {
  createColorPickerUI();

  const y = 150;
  startBtn = new LJS.UIButton(vec2(0, y), vec2(200, 50), "Start", LJS.CYAN);

  // startBtn.pos = LJS.mainCanvasSize.multiply(vec2(0.5, 0.8));

  colorPickerBtn = new LJS.UIButton(vec2(100 + 60, y), vec2(50, 50));

  colorPickerBtn.hoverColor = colorPickerBtn.color = playerColor;
  colorPickerBtn.cornerRadius = 10;
  colorPickerBtn.onClick = () => {
    colorPickerMenu.visible = true;
    titleObj.visible = false;
    colorPickerBtn.lineColor = LJS.BLACK;
  };

  colorPickerBtn.onEnter = () => {
    colorPickerBtn.lineColor = LJS.WHITE;
  };
  colorPickerBtn.onLeave = () => {
    colorPickerBtn.lineColor = LJS.BLACK;
  };

  titleObj.addChild(startBtn);
  titleObj.addChild(colorPickerBtn);
}

function createColorPickerUI() {
  const btnSize = 50;
  const btnPadding = 5;

  colorPickerMenu = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));
  colorPickerMenu.visible = false;

  colorPickerMenu.color = LJS.GRAY;
  colorPickerMenu.lineColor = LJS.BLACK;

  let mkColorBtn = (pos: LJS.Vector2, color: LJS.Color, text?: string) => {
    let btn = new LJS.UIButton(pos, vec2(btnSize));

    btn.color = color;
    btn.textColor = LJS.BLACK;
    if (text) btn.text = text;
    btn.interactive = true;
    btn.cornerRadius = 10;
    btn.activeColor = color;
    btn.hoverColor = color;

    btn.onEnter = () => {
      btn.lineColor = LJS.WHITE;
    };
    btn.onLeave = () => {
      btn.lineColor = LJS.BLACK;
    };

    btn.onClick = () => {
      colorPickerBtn.hoverColor = colorPickerBtn.color = playerColor = color;
      colorPickerBtn.text = text ?? "";
      colorPickerMenu.visible = false;
      titleObj.visible = true;
      btn.lineColor = LJS.BLACK;
    };

    return btn;
  };

  let cue = new LJS.UIText(vec2(0, -100), vec2(1000, 50), "Character color");
  cue.textColor = LJS.WHITE;

  let randomColorBtn = mkColorBtn(
    vec2(-btnSize - btnPadding, 50 + -btnSize - btnPadding * 2),
    LJS.WHITE,
    "?"
  );

  colorPickerMenu.addChild(cue);
  colorPickerMenu.addChild(randomColorBtn);

  for (
    let i = 0, x = -btnSize - btnPadding;
    i < 3;
    i++, x += btnSize + btnPadding
  ) {
    for (
      let j = i === 0 ? 1 : 0, y = 50 + btnSize;
      j < 3;
      j++, y -= btnSize + btnPadding
    ) {
      colorPickerMenu.addChild(
        mkColorBtn(vec2(x, y), hsl(i / 3 + j / 9, 0.75, 0.5))
      );
    }
  }
}

export let pauseMenu: LJS.UIObject;
export let quitBtn: LJS.UIObject;
export let resumeBtn: LJS.UIObject;

export function createPauseMenu() {
  pauseMenu = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));

  const text = new LJS.UIText(vec2(0, -100), vec2(1000, 50), "PAUSE");

  text.textColor = LJS.WHITE;

  resumeBtn = new LJS.UIButton(vec2(0, 150), vec2(200, 50), "Resume", LJS.GRAY);
  quitBtn = new LJS.UIButton(vec2(0, 215), vec2(200, 50), "Quit", LJS.RED);

  pauseMenu.addChild(text);
  pauseMenu.addChild(quitBtn);
  pauseMenu.addChild(resumeBtn);
}
