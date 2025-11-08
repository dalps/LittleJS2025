import * as LJS from "littlejsengine";
import { SpeechBubble } from "./uiUtils";
import {
  center,
  clearRow,
  currentSong,
  makeRow,
  setCurrentSong,
  titleScreen,
} from "./main";
import type { Microbe } from "./entities/microbe";
import { goodThreshold, type Player } from "./entities/player";
import {
  myFirstConsoleTutorial,
  tutorialChoreo2,
  tutorialChoreo3,
} from "./songs";
import { PatternWrapping, type TimingInfo } from "./beat";
import { LOG } from "./mathUtils";
const { vec2, rgb, tile } = LJS;

export let hasDoneTutorial = false;
const beatsToHit = 8;

let score = 0;
let beatsLeft = beatsToHit;
let player: Player;

let t1: LJS.UIText;
let t2: LJS.UIText;

export function tutorial() {
  setCurrentSong(myFirstConsoleTutorial);
  currentSong.loopStart = 3.333; // 2 bar 1 beat 1 sub

  let row = makeRow({
    playerIdx: 1,
    wrapping: PatternWrapping.HoldLast,
  }) as [Microbe, Player];
  let [leader] = row;

  player = row[1];
  player.interactive = false;

  t1 = new LJS.UIText(
    LJS.mainCanvasSize.multiply(vec2(0.5, 0.8)),
    vec2(1000, 20)
  );
  t2 = new LJS.UIText(vec2(0, 40), vec2(1000, 40));
  t1.addChild(t2);
  t1.textColor = t2.textColor = LJS.WHITE;
  t1.shadowColor = t2.shadowColor = LJS.BLACK;

  const pos = () => LJS.worldToScreen(leader.pos).subtract(vec2(0, 100));

  new SpeechBubble(pos(), "Hello there!") //
    .then(() => {
      leader.idle();
      new SpeechBubble(
        pos(),
        `Let us teach you our moves.` // `Welcome to the mitochondrion. We are in charge of cellular respiration.`
      ).then(() => {
        //         leader.idle();
        //         new SpeechBubble(
        //           pos(),
        //           `Our tiny march powers up the cell by burning oxygen.
        // Let us show you the ropes.`
        //         ).then(() => {
        leader.idle();
        new SpeechBubble(pos(), `Ready?`).then(() => {
          t1.text = `Click on the 1st and 3rd beat.`;
          testPlayer([1, 3], (finalScore) => {
            LOG(`finalScore: ${finalScore}`);

            new SpeechBubble(
              pos(),
              finalScore >= 0.85 ? `Awesome!` : `That'll do.`
            ).then(() =>
              new SpeechBubble(pos(), `Let's try a different pattern.`).then(
                () =>
                  new SpeechBubble(
                    pos(),
                    `This time, we'll march to the offbeat.`
                  ).then(() => {
                    new SpeechBubble(pos(), `We ready?!`).then(() => {
                      currentSong.setChoreography(tutorialChoreo2);
                      row.forEach((m) => m.setChoreography()); // song should take care of this

                      t1.text = `Click on the 2nd and 4th beat.`;
                      testPlayer([2, 4], (finalScore) => {
                        LOG(`finalScore: ${finalScore}`);
                        new SpeechBubble(
                          pos(),
                          finalScore >= 0.85 ? `Sweet!` : `Not bad.`
                        ).then(() =>
                          new SpeechBubble(pos(), `One last pattern.`).then(
                            () =>
                              new SpeechBubble(
                                pos(),
                                `When you hear a bell ding...`
                              ).then(() =>
                                new SpeechBubble(
                                  pos(),
                                  `...swim for the next three beats!`
                                ).then(() =>
                                  new SpeechBubble(
                                    pos(),
                                    `Ok, here we go!`
                                  ).then(() => {
                                    currentSong.setChoreography(
                                      tutorialChoreo3
                                    );
                                    row.forEach((m) => m.setChoreography());

                                    t1.text = `Click on the 2nd, 3rd and 4th beat after the ding.`;

                                    testPlayer([2, 3, 4], () => {
                                      new SpeechBubble(
                                        pos(),
                                        finalScore >= 0.85
                                          ? `You got rhythm!`
                                          : `I think you're ready.`
                                      ).then(() =>
                                        new SpeechBubble(
                                          pos(),
                                          `Congrats! You completed the tutorial!`
                                        ).then(() =>
                                          new SpeechBubble(
                                            pos(),
                                            `Now, march on to the main levels.`
                                          ).then(titleScreen)
                                        )
                                      );
                                    });
                                  })
                                )
                              )
                          )
                        );
                      });
                    });
                  })
              )
            );
          });
          // });
        });
      });
    });

  hasDoneTutorial = true;
}

function testPlayer(
  /** Which beats should the player hit? */
  beats: number[],
  /** What happens after the player passes the test */
  onComplete: (score: number) => void,
  /** What happens after the player makes hit a beat correctly */
  onProgress?: () => void
) {
  score = 0;
  beatsLeft = beatsToHit;
  t2.text = `${beatsToHit} times left.`;
  t1.visible = true;

  currentSong.addMetronome();
  currentSong.play({ loop: true });

  player.interactive = true;

  player.onClick = ({ accuracy, count: [currentBeat] }: TimingInfo) => {
    const correctBeat = beats.find((b) => b === currentBeat);
    // LOG(`${currentBeat} vs ${beats}: ${correctBeat}`);

    if (correctBeat && accuracy >= goodThreshold) {
      t2.text = `${beatsLeft} times left.`;
      onProgress && onProgress();

      LOG(`${score} (+${accuracy})`);
      score += accuracy;
      if (--beatsLeft < 0) {
        currentSong.stop();
        player.interactive = false;
        t1.visible = false;
        onComplete(score / beatsToHit);
      }
    }
  };
}
