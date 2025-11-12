import * as LJS from "littlejsengine";
import { blink, sleep } from "./animUtils";
import { center, spriteAtlas } from "./main";
import { DEG2RAD, LOG, setAlpha } from "./mathUtils";
import { sfx } from "./sfx";
const { vec2, rgb, tile } = LJS;

export const speech = (pos: LJS.Vector2, text: string) =>
  new SpeechBubble(pos, text);

export class SpeechBubble extends LJS.UIText {
  then: (f?: (...args: any[]) => any) => this;

  constructor(
    pos: LJS.Vector2,
    text: string,
    {
      duration = 30,
      size = vec2(200, 50),
      align = "center" as CanvasTextAlign,
      padding = 20,
    } = {}
  ) {
    super(pos, size, text, align);

    const lines = text.split(`\n`);
    const longestLineLength = Math.max(...lines.map((l) => l.length));

    this.color = LJS.WHITE;
    this.lineWidth = 3;
    this.lineColor = LJS.BLACK;
    this.cornerRadius = this.size.y * 0.25;
    this.textColor = LJS.BLACK;
    this.textHeight = 24;
    this.size = vec2(
      longestLineLength * (this.textHeight / 2),
      this.textHeight * lines.length
    ).add(vec2(padding));
    this.interactive = false;
    this.hoverColor = this.color;
    this.activeColor = this.lineColor;
    this.canBeHover = true;
    this.then = (f) => ((this.then = f!), this);

    sfx.blink.play();

    sleep(duration).then(() => {
      const arrowSize = vec2(15);
      const nextBtn = new LJS.UITile(
        this.pos.add(this.size.scale(0.5).subtract(arrowSize)),
        arrowSize,
        spriteAtlas.play,
        LJS.BLACK
      );
      blink(nextBtn.color, 20);
      new ScreenButton(() => {
        nextBtn.destroy();
        this.destroy();
        this.then();
      });

      // nextBtn.interactive = this.interactive = true;
    });
  }

  render(): void {
    super.render();

    // arrow pointing down
    LJS.drawTile(
      this.pos.add(this.size.multiply(vec2(0, 0.5))),
      vec2(50, 25),
      spriteAtlas.play,
      LJS.BLACK,
      90 * DEG2RAD,
      undefined,
      undefined,
      undefined,
      true
    );
  }
}

export class ScreenButton extends LJS.UIButton {
  constructor(onClick: Function) {
    super(LJS.mainCanvasSize.scale(0.5), LJS.mainCanvasSize);

    this.color =
      this.lineColor =
      this.hoverColor =
      this.activeColor =
        LJS.CLEAR_WHITE;

    // this.hoverColor = setAlpha(LJS.WHITE, 0.5);

    this.onClick = () => {
      onClick();
      this.destroy();
    };
  }
}

export const uitext = (
  text: string,
  {
    pos = center,
    fontSize = 20,
    fontStyle = "",
    textColor = LJS.WHITE,
    align = "center" as CanvasTextAlign,
  } = {}
) => {
  let t = new LJS.UIText(pos, vec2(1000, fontSize), text, align);
  t.textColor = textColor;
  t.fontStyle = fontStyle;
  t.hoverColor = t.color = LJS.CLEAR_WHITE;
  return t;
};
