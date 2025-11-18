import * as LJS from "littlejsengine";
const { Sound, SoundWave } = LJS;

// prettier-ignore
export const sfx = {
  bubble1: new LJS.Sound([2,,426,.01,.01,.01,,3.3,,-1,,,,.4,,.1,.25,.97,.01,,264]),
  bubble2: new LJS.Sound([2,,426,.01,.01,.01,,3.3,,,,,,,,,.25,.97]),
  bubble3: new Sound([2,,226,.01,.03,.03,,1.3,32,,,,,,,,.11,.53,.02,.38,-1436]), // Blip 1045
  bubble4: new Sound([1.8,,303,,.05,,1,1.4,6,13,,,.14,,,,.18,.56,.09,.27,230]), // Shoot 1062
  heart: new Sound([1.1,,10,.03,.03,.03,4,1.9,,,-93,.31,.03,.3,,,,.53,.02]),
  swim: new Sound([.5,.1,110,.06,.07,,,.6,,40,,,,,,,,.54,.04,1]), // Pickup 1014
  bip: new Sound([.2,0,440,,,.05,,.3,,,,,,,,,,.77,.01]), // Music 1108
  bump: new Sound([2.1,,182,.02,.03,.04,,2.6,,38,,,,,58,,.31,.67,.01]), // Blip 1022
  bump2: new Sound([,0,110,.01,.09,.11,,1.8,-3,,,,,,,,,,.05,,-2e3]), // Blip 1022
  bump3: new Sound([,0,110,.01,.05,.11,3,1.8,-3,,,,,,,,,,.05,,-200]), // Blip 1022
  bump4: new SoundWave('./sfx/bounce_fast.mp3'),
  bloop: new SoundWave('./sfx/little_bloop.mp3'),
  bueups: new SoundWave('./sfx/bueups_fast.mp3'),
  cool: new Sound([.5,,739,.02,.04,.03,1,0,1,,-217,.01,,,71,,.02,.59,.03,,333]), // Blip 1041
  tic: new Sound([2,0,440,.01,,.02,1,3.3,,,,,,,,,,.7,.01]), // Blip 1066
  note: new Sound([2,,770,.01,.04,.04,,.3,,26,,,,,,,.13,.69,.02]),
  blink: new Sound([0.2,0,440,,,.03,,.3,2,30,200,.1,.23,,,.1,,.69,.02,.3]),
  ding: new SoundWave('./sfx/bell-hit-thin-3.mp3'),
  ding2: new Sound([2.1,0,1760,.02,.34,.44,1,1.7,,,,,,,,,.08,.57,.06]), // Music 1105
  bell: new SoundWave('./sfx/bell-hit-thin-f5.mp3'),
  bell_church: new SoundWave('./sfx/bell-hit-church-2.mp3'),
  bell_g5: new SoundWave('./sfx/bell-hit-church-g5.mp3'),
  bell_error: new SoundWave('./sfx/bell-hit-thin-cs2.mp3'),
}
