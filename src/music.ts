import * as LJS from "littlejsengine";
import { Beat, type Pattern } from "./beat";
import { Metronome } from "./metronome";
const { vec2, rgb } = LJS;

export class Song {
  // metadata
  title: string;
  author: string;
  year: string;

  // music
  beat: Beat;
  sound: LJS.SoundWave;
  soundInstance?: LJS.SoundInstance;
  choreography: Pattern<number>;

  // ui
  metronome?: Metronome;
  songContainer?: LJS.UIObject;

  constructor(
    public filename: string,
    public bpm: number,
    {
      title = "",
      author = "",
      year = "",
      beats = 4,
      subs = 1,
      onLoad = () => {},
      onEnd = () => {},
      choreography = [],
    } = {}
  ) {
    this.beat = new Beat(bpm, beats, subs);
    this.sound = new LJS.SoundWave(filename);
    this.choreography = choreography;
    this.sound.onloadCallback = (wav) => {
      this.sound = wav;
      onLoad.call(this);
      return this.sound;
    };
    this.title = title;
    this.author = author;
    this.year = year;
  }

  /**
   * Play the song immediately
   */
  play() {
    if (!this.sound?.isLoaded()) return;

    this.soundInstance = this.beat?.play(this.sound);
  }

  /**
   * Play a count-in pattern before the main song
   */
  countIn(bars = 1) {
    if (!this.sound?.isLoaded()) return;
  }

  stop() {
    this.beat?.stop();
    this.songContainer?.destroy()
    this.soundInstance?.stop();
  }

  addMetronome() {
    const metronomePos = LJS.mainCanvasSize.multiply(vec2(0.5, 0.1));
    this.metronome = new Metronome(metronomePos, this.beat!);
  }

  show(pos = LJS.mainCanvasSize.multiply(vec2(0.1, 0.9))) {
    this.songContainer = new LJS.UIObject(pos);

    let titleText = new LJS.UIText(vec2(), vec2(100, 20), this.title);
    let authorText = new LJS.UIText(vec2(0, 20), vec2(100, 14), this.author);

    titleText.fontStyle = "italic";
    titleText.align = authorText.align = "left";
    titleText.lineWidth = authorText.lineWidth = 0.1;
    titleText.textColor = authorText.textColor = LJS.WHITE;
    titleText.lineColor = authorText.lineColor = LJS.BLACK;

    this.songContainer.addChild(titleText);
    this.songContainer.addChild(authorText);
  }
}
