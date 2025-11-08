import * as LJS from "littlejsengine";
import { SpeechBubble } from "./uiUtils";
import { center, clearRow, currentSong, makeRow, setCurrentSong } from "./main";
import type { Microbe } from "./entities/microbe";
import { goodThreshold, type Player } from "./entities/player";
import { myFirstConsoleTutorial, tutorialChoreo2 } from "./songs";
import { PatternWrapping, type TimingInfo } from "./beat";
import { LOG } from "./mathUtils";
const { vec2, rgb, tile } = LJS;

export let hasDoneTutorial = false;
const beatsToHit = 8;

let score = 0;
let beatsLeft = beatsToHit;

export function tutorial() {
  setCurrentSong(myFirstConsoleTutorial);
  currentSong.addMetronome();

  clearRow();

  let [leader, player] = makeRow({
    playerIdx: 1,
    wrapping: PatternWrapping.HoldLast,
  }) as [Microbe, Player];

  player.interactive = false;

  const pos = LJS.worldToScreen(leader.pos).subtract(vec2(0, 100));
  new SpeechBubble(pos, "Hello there!") //
    .then(() => {
      leader.idle();
      new SpeechBubble(
        pos,
        `Let us show you our moves.` // `Welcome to the mitochondrion. We are in charge of cellular respiration.`
      ).then(() => {
        //         leader.idle();
        //         new SpeechBubble(
        //           pos,
        //           `Our tiny march powers up the cell by burning oxygen.
        // Let us show you the ropes.`
        //         ).then(() => {
        leader.idle();
        new SpeechBubble(pos, `Ready?`).then(() => {
          let t1 = new LJS.UIText(
            LJS.mainCanvasSize.multiply(vec2(0.5, 0.8)),
            vec2(1000, 20),
            `Press space or click on the 1st and 3rd beat.`
          );
          let t2 = new LJS.UIText(
            vec2(0, 40),
            vec2(1000, 40),
            `${beatsToHit} times left.`
          );
          t1.addChild(t2);

          t1.textColor = t2.textColor = LJS.WHITE;
          t1.shadowColor = t2.shadowColor = LJS.BLACK;

          player.onClick = testPlayer(
            () => {
              t2.text = `${beatsLeft} times left.`;
            },
            () => {
              currentSong.stop();
              player.interactive = false;
              t1.visible = false;

              let finalScore = score / 8;

              LOG(`finalScore: ${finalScore}`);

              new SpeechBubble(
                pos,
                finalScore >= 0.5 ? `Awesome!` : `That'll do.`
              ).then(() =>
                new SpeechBubble(pos, `Let's try a different pattern...`).then(
                  () =>
                    new SpeechBubble(pos, `We ready?`).then(() => {
                      currentSong.setChoreography(tutorialChoreo2);
                      currentSong.addMetronome();
                      currentSong.play();
                    })
                )
              );
            }
          );

          currentSong.play(true);

          const songSrc = currentSong.soundInstance!.source;
          songSrc.loopStart = 3.333; // 2 bar 1 beat 1 sub
          songSrc.loopEnd = songSrc.buffer!.duration;

          player.interactive = true;

          // });
        });
      });
    });

  hasDoneTutorial = true;
}

function testPlayer(onProgress: () => void, onComplete: () => void) {
  score = 0;
  beatsLeft = beatsToHit;

  return ({ accuracy, count: [beat] }: TimingInfo) => {
    if ((beat === 1 || beat === 3) && accuracy >= goodThreshold) {
      onProgress();
      LOG(`${score} (+${accuracy})`);
      score += accuracy;
      if (--beatsLeft < 0) onComplete();
    }
  };
}
