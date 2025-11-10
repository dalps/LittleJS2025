import * as LJS from "littlejsengine";
import {
  center,
  currentSong,
  playerColor,
  setPlayerColor,
  spriteAtlas,
  titleMenu,
  titleText,
  type AtlasKey,
} from "./main";
import { LOG, rgba } from "./mathUtils";
import { uitext as uiText } from "./uiUtils";
import { Tween } from "./tween";
const { vec2, rgb, hsl } = LJS;

export let colorPickerMenu: LJS.UIObject;
export let colorPickerBtn: LJS.UIObject;
export let startBtn: LJS.UIButton;

export class IconButton extends LJS.UIButton {
  constructor(
    btnPos: LJS.Vector2,
    iconKey: AtlasKey,
    {
      btnSize = vec2(50, 50),
      iconPos = vec2(),
      iconSize = vec2(40),
      iconColor = undefined as LJS.Color | undefined,
      iconAngle = 0,
      onClick = () => {},
      onEnter = () => {},
      onLeave = () => {},
    } = {}
  ) {
    super(btnPos, btnSize);

    let icon = new LJS.UITile(
      iconPos,
      iconSize,
      spriteAtlas[iconKey],
      iconColor,
      iconAngle
    );
    this.addChild(icon);

    icon.interactive = icon.canBeHover = true;

    // TODO: use a Proxy to set both UIObjects's listeners
    this.onClick = icon.onClick = onClick.bind(this);
    this.onEnter = icon.onEnter = onEnter.bind(this);
    this.onLeave = icon.onLeave = onLeave.bind(this);
  }
}

export function createTitleMenu() {
  createColorPickerUI();

  const y = 150;
  const startBtnSize = vec2(200, 50);
  startBtn = new LJS.UIButton(vec2(0, y), startBtnSize, "Start", LJS.CYAN);

  // startBtn.pos = LJS.mainCanvasSize.multiply(vec2(0.5, 0.8));

  colorPickerBtn = new IconButton(vec2(100 + 60, y), "microbe_bw", {
    onClick: () => {
      colorPickerMenu.visible = true;
      titleText.visible = titleMenu.visible = false;
      colorPickerBtn.lineColor = LJS.BLACK;
    },
    onEnter: () => {
      colorPickerBtn.lineColor = LJS.WHITE;
    },
    onLeave: () => {
      colorPickerBtn.lineColor = LJS.BLACK;
    },
  });

  colorPickerBtn.hoverColor = colorPickerBtn.color = playerColor;
  colorPickerBtn.cornerRadius = 10;

  let credits = new LJS.UIText(
    center.multiply(vec2(0, 0.9)),
    vec2(100, 15),
    `dalps 2025`
  );

  let sourcecodeBtn = new IconButton(center.subtract(vec2(-50)), "github");
  // sourcecodeBtn.lineWidth = 3;
  sourcecodeBtn.cornerRadius = 10;
  sourcecodeBtn.lineColor = sourcecodeBtn.hoverColor = LJS.BLACK;

  // credits.addChild(sourcecodeBtn);

  sourcecodeBtn.color = credits.textColor = rgba(235, 235, 235, 1);

  credits.hoverColor = LJS.CLEAR_WHITE;

  credits.interactive = credits.canBeHover = true;

  credits.onClick = sourcecodeBtn.onClick = () => {
    open(`https://github.com/dalps/LittleJS2025`, `_blank`);
  };

  titleMenu.addChild(credits);
  titleMenu.addChild(sourcecodeBtn);
  titleMenu.addChild(startBtn);
  titleMenu.addChild(colorPickerBtn);
}

function createColorPickerUI() {
  const btnSize = 50;
  const btnPadding = 5;

  colorPickerMenu = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));
  colorPickerMenu.visible = false;

  colorPickerMenu.color = playerColor;
  colorPickerMenu.lineColor = LJS.BLACK;

  let mkColorBtn = (
    pos: LJS.Vector2,
    color?: LJS.Color,
    iconKey?: AtlasKey
  ) => {
    let btn = new LJS.UIButton(pos, vec2(btnSize));
    let icon: LJS.UITile;

    btn.color = color ?? LJS.WHITE;
    btn.textColor = LJS.BLACK;
    btn.interactive = true;
    btn.cornerRadius = 10;
    btn.activeColor = color;
    btn.hoverColor = color ?? LJS.WHITE;

    const onEnter = () => {
      btn.lineColor = LJS.WHITE;
    };
    const onLeave = () => {
      btn.lineColor = LJS.BLACK;
    };

    const onClick = () => {
      colorPickerBtn.hoverColor = colorPickerBtn.color =
        color ?? LJS.randColor();
      setPlayerColor(colorPickerBtn.color);
      colorPickerMenu.visible = false;
      titleText.visible = titleMenu.visible = true;
      btn.lineColor = LJS.BLACK;
    };

    btn.onClick = onClick;
    btn.onEnter = onEnter;
    btn.onLeave = onLeave;

    if (iconKey) {
      icon = new LJS.UITile(vec2(), vec2(40), spriteAtlas[iconKey]);
      icon.interactive = true;
      icon.onClick = onClick;
      icon.onEnter = onEnter;
      icon.onLeave = onLeave;
      btn.addChild(icon);
    }

    return btn;
  };

  let cue = new LJS.UIText(vec2(0, -100), vec2(1000, 50), "Character color");
  cue.textColor = LJS.WHITE;

  let randomColorBtn = mkColorBtn(
    vec2(-btnSize - btnPadding, 50 + -btnSize - btnPadding * 2),
    undefined,
    "die"
  );

  colorPickerMenu.addChild(cue);
  colorPickerMenu.addChild(randomColorBtn);

  const colorOpts = [
    LJS.GREEN,
    LJS.RED,
    LJS.YELLOW,
    LJS.BLUE,
    LJS.MAGENTA,
    LJS.CYAN,
    LJS.GRAY,
    LJS.PURPLE,
  ].map((c) => {
    let [h, s, _] = c.HSLA();
    return c.copy().setHSLA(h, s * 0.75, 0.5);
  });

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
        mkColorBtn(vec2(x, y), colorOpts[i * 3 + (j - 1)]) // hsl((i * 3 + j) / 8, 0.75, 0.5)
      );
    }
  }
}

export let pauseMenu: LJS.UIObject;
export let quitBtn: LJS.UIObject;
export let resumeBtn: LJS.UIObject;

export function createPauseMenu() {
  pauseMenu = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));

  const title = uiText("PAUSE", {
    pos: vec2(0, -100),
    fontSize: 50,
  });

  // resumeBtn = new LJS.UIButton(vec2(0, 150), vec2(200, 50), "Resume", LJS.GRAY);
  quitBtn = new LJS.UIButton(vec2(0, 150), vec2(200, 50), "Quit", LJS.RED);

  quitBtn.addChild(
    uiText(`(no resume for now, sorry!)`, {
      pos: vec2(0, -60),
      fontSize: 20,
    })
  );
  pauseMenu.addChild(title);
  pauseMenu.addChild(quitBtn);
  // pauseMenu.addChild(resumeBtn);
}
