import * as LJS from "littlejsengine";
import { Beat, type Pattern } from "./beat";
import {
  countInMetronomePattern,
  defaultMetronomePattern,
  Metronome,
} from "./metronome";
import { tileSize } from "./main";
import { Ease, Tween } from "./tween";
import { DEG2RAD, LOG, rgba } from "./mathUtils";
const { vec2, rgb, tile } = LJS;

// prettier-ignore
const countInPattern: Pattern<number> = [
  [
    [0, ],
    [ , ],
    [0, ],
    [ , ],
  ],
  [
    [0, ],
    [0, ],
    [0, ],
    [0, ],
  ],
]

export class Song {
  // metadata
  title: string;
  author: string;
  year: string;
  href: string;

  // music
  beat: Beat;
  sound: LJS.SoundWave;
  soundInstance?: LJS.SoundInstance;
  choreography: Pattern<number>;
  orignalChoreo: Pattern<number>;

  // ui
  metronome: Metronome;
  songContainer?: LJS.UIObject;
  unlocked = false;
  color: LJS.Color;

  onEnd: Function;

  constructor(
    public filename: string,
    public bpm: number,
    {
      title = "",
      author = "",
      year = "",
      href = "",
      color = LJS.randColor(),
      beats = 4,
      subs = 1,
      onLoad = () => {},
      onEnd = () => {},
      choreography = [] as Pattern<number>,
    } = {}
  ) {
    this.beat = new Beat(bpm, beats, subs);
    this.sound = new LJS.SoundWave(filename);
    this.orignalChoreo = choreography;
    this.choreography = choreography.slice(0);
    this.color = color;
    this.sound.onloadCallback = (wav) => {
      this.sound = wav;
      onLoad.call(this);
      return this.sound;
    };
    this.onEnd = onEnd;
    this.title = title;
    this.author = author;
    this.year = year;
    this.href = href;

    const metronomePos = LJS.mainCanvasSize.multiply(vec2(0.5, 0.9));
    this.metronome = new Metronome(metronomePos, this.beat);
  }

  /**
   * Play the song immediately
   */
  play() {
    if (!this.sound?.isLoaded()) return;

    if (!this.unlocked) {
      // play silent buffer to unlock the audio
      const buffer = LJS.audioContext.createBuffer(1, 1, 22050);
      const node = LJS.audioContext.createBufferSource();
      node.buffer = buffer;
      node.start(0);
      this.unlocked = true;
    }

    if (this.soundInstance) this.soundInstance.stop();
    this.soundInstance = this.sound.playMusic(1, false);
    this.soundInstance.getSource().addEventListener("ended", () => {
      // this is fired even when the song is paused, hence the guard
      if (this.beat.barCount >= this.choreography.length - 1) this.onEnd();
    });

    LOG(`Now playing: ${this}`);
    this.beat.play();
    this.show();
  }

  /**
   * Play a count-in pattern before the main song
   */
  countIn(bars = 2) {
    if (!this.sound?.isLoaded()) return;

    if (this.metronome)
      this.metronome.pattern = [
        ...countInMetronomePattern,
        ...defaultMetronomePattern,
      ];

    this.choreography = [...countInPattern, ...this.orignalChoreo];
    this.beat.atbeat([0, 0, bars], this.play.bind(this));
    this.metronome.start();
    this.beat.play();
  }

  pause() {
    this.beat?.stop();
    this.metronome.stop();
    this.soundInstance?.pause();
  }

  resume() {
    this.beat?.play();
    this.metronome.start();
    this.soundInstance?.resume();
  }

  stop() {
    this.beat?.stop();
    this.metronome.destroy();
    this.songContainer?.destroy();
    this.soundInstance?.stop();
    this.hide();
  }

  addMetronome() {
    this.metronome.start();
    this.metronome.show();
  }

  show(pos = LJS.mainCanvasSize.multiply(vec2(0.1, 0.9))) {
    const size = vec2(200, 50);
    this.songContainer = new LJS.UIButton(pos, size);

    new Tween(
      (t) => (this.songContainer!.pos.x = t),
      -200,
      LJS.mainCanvasSize.x * 0.1,
      100
    ).setEase(Ease.OUT(Ease.EXPO));

    this.songContainer.render = () => {
      LJS.drawRectGradient(
        this.songContainer!.pos.add(vec2(8)),
        vec2(50, 200),
        rgba(255, 255, 255, 0.37),
        LJS.CLEAR_WHITE,
        90 * DEG2RAD,
        true,
        true
      );
    };

    this.songContainer.onClick = () => {
      open(this.href, "_blank", "noopener,noreferrer");
    };

    this.songContainer.onEnter = () => {
      document.body.style.cursor = "pointer";
    };

    this.songContainer.onLeave = () => {
      document.body.style.cursor = "initial";
    };

    let titleText = new LJS.UIText(vec2(), vec2(100, 20), this.title);
    let authorText = new LJS.UIText(vec2(0, 20), vec2(100, 14), this.author);

    titleText.fontStyle = "italic";
    titleText.align = authorText.align = "left";
    titleText.textColor = authorText.textColor = LJS.WHITE;
    titleText.lineColor = authorText.lineColor = LJS.CLEAR_WHITE;
    titleText.textLineWidth = authorText.textLineWidth = 3;
    titleText.textLineColor = authorText.textLineColor = LJS.BLACK;

    const musicalNoteColor = rgba(255, 255, 255, 0.7);
    let musicalNotes: LJS.UITile[] = [
      new LJS.UITile(
        vec2(-45, 5),
        vec2(25),
        tile(vec2(7, 1), tileSize, 2),
        musicalNoteColor
      ),
      new LJS.UITile(
        vec2(-25, 12.5),
        vec2(30),
        tile(vec2(8, 1), tileSize, 2),
        musicalNoteColor
      ),
    ];

    musicalNotes.forEach((n, idx) => {
      this.songContainer?.addChild(n);
      new Tween((t) => (n.angle = t), -15 * DEG2RAD, 15 * DEG2RAD, 50).then(
        Tween.PingPong
      );
    });
    this.songContainer.addChild(titleText);
    this.songContainer.addChild(authorText);
  }

  hide() {
    new Tween(
      (t) => (this.songContainer!.pos.x = t),
      LJS.mainCanvasSize.x * 0.1,
      -200,
      100
    )
      .then(() => this.songContainer?.destroy())
      .setEase(Ease.OUT(Ease.EXPO));
  }

  getFinalScore() {
    return (
      ((this.metronome && this.metronome.score) ?? 0) /
      (this.orignalChoreo.length * this.beat.beats)
    );
  }

  toString() {
    return `${this.title} by ${this.author}`;
  }
}
