import * as LJS from "littlejsengine";
import { Beat, type Pattern } from "./beat";
const { vec2, rgb } = LJS;

export class Song {
  sound?: LJS.SoundWave;
  soundInstance?: LJS.SoundInstance;
  beat?: Beat;
  pattern: Pattern<number> = [];
  title: string;
  author: string;
  year: number;

  constructor(
    public filename: string,
    public bpm: number,
    {
      title = "",
      author = "",
      year = 0,
      beats = 4,
      subs = 1,
      onLoad = () => {},
      onEnd = () => {},
    } = {}
  ) {
    this.beat = new Beat(bpm, beats, subs);
    this.sound = new LJS.SoundWave(filename);
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
  play() {}

  /**
   * Play a count-in pattern before the main song
   */
  countIn(bars = 1) {}

  stop() {}
}

export const songs = {
  paarynasAllrite: new Song(
    "Paaryna's allrite",
    "",
    "/songs/paarynas-allrite.mp3",
    102
  ),
  stardustMemories: new Song(
    "Stardust Memories",
    "",
    "/songs/stardustmemories.mp3",
    125
  ),
};
