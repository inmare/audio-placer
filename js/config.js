const AUDIO_STATUS = {
  play: "play",
  pause: "pause",
};

const SCROLL_POS = {
  start: "start",
  end: "end",
};

const MOVE_TYPE = {
  up: "up",
  down: "down",
};

const PIXEL_RATIO = window.devicePixelRatio || 1;

const CANVAS_AUDIO_CHUNK = 10000 / 4;

const DEFAULT_AUDIO_INFO = {
  audioData: null,
  audioInitGain: 0,
  audioGain: 0,
  audioStart: 0,
  audioEnd: 0,
};

const IMG_PATH = {
  play: "img/play-solid.svg",
  pause: "img/pause-solid.svg",
};

export {
  AUDIO_STATUS,
  SCROLL_POS,
  MOVE_TYPE,
  PIXEL_RATIO,
  CANVAS_AUDIO_CHUNK,
  DEFAULT_AUDIO_INFO,
  IMG_PATH,
};
