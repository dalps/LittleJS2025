import * as LJS from "littlejsengine";
const { vec2, rgb } = LJS;

interface Song {
  filename: string;
  bpm: number;
  sound?: LJS.SoundWave;
}

function song(filename: string, bpm: number): Song {
  // const sound = new LJS.SoundWave(filename);
  return { filename, bpm };
}

export const songs = {
  paarynasAllrite: song("/songs/paarynas-allrite.mp3", 102),
  stardustMemories: song("/songs/stardustmemories.mp3", 125),
};
