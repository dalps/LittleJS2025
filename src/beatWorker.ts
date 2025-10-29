// Based on Chris Wilson's implementation
//    https://github.com/cwilso/metronome

let timerID: number | null;
let interval: number;

self.onmessage = function (e: MessageEvent) {
  const tickFn = () => postMessage("tick");

  if (e.data === "start") {
    timerID = setInterval(tickFn, interval);
  } else if (e.data.interval) {
    interval = e.data.interval;

    if (timerID) {
      clearInterval(timerID);
      timerID = setInterval(tickFn, interval);
    }
  } else if (e.data === "stop") {
    if (timerID) clearInterval(timerID);
    timerID = null;
  }
};
