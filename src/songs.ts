import { repeat } from "./mathUtils";
import { Song } from "./music";

export let paarynasAllrite: Song | undefined;
export let stardustMemories: Song | undefined;

export function initSongs() {
  paarynasAllrite = new Song("/songs/paarynas-allrite.mp3", 102, {
    title: "Paaryna's allrite",
    author: "DIZZY / CNDC",
    year: "1995",
  });

  // prettier-ignore
  const p1 = [
  [0, ],
  [0, ],
  [0, ],
  [0, ],
];

  // prettier-ignore
  const p2 = [
  [2, ],
  [1, ],
  [1, ],
  [1, ],
];

  // prettier-ignore
  const p3 = [
  [1, ],
  [0, ],
  [1, ],
  [1, ],
];

  stardustMemories = new Song("/songs/stardustmemories.mp3", 125, {
    title: "Stardust Memories",
    author: "Jester / Sanity",
    year: "1992",
    choreography: [
      repeat([p2, p3, p3, p3], 4).flat(),
      repeat(p2, 16),
      repeat([p2, p3], 4).flat(),
      repeat(p2, 16),
    ].flat(),
  });
}
