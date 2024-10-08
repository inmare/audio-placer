import playImgPath from "../img/play-solid.svg";
import pauseImgPath from "../img/pause-solid.svg";

export const AUDIO_STATUS = {
  play: "play",
  pause: "pause",
};

export const SCROLL_POS = {
  start: "start",
  end: "end",
};

export const MOVE_TYPE = {
  up: "up",
  down: "down",
};

export const RANGE_TYPE = {
  start: "start",
  end: "end",
};

export const PIXEL_RATIO = window.devicePixelRatio || 1;

export const CANVAS_AUDIO_CHUNK = 10000 / 4;

export const DEFAULT_AUDIO_INFO = {
  audioData: null,
  audioGain: 0,
  audioStart: 0,
  audioEnd: 0,
};

export const IMG_PATH = {
  play: playImgPath,
  pause: pauseImgPath,
};

export const MP3_CONFIG = {
  sampleRate: 48000,
  kbps: 192,
  channels: 2,
  sampleBlockSize: 576 * 2,
  padSecond: 1.5,
};
