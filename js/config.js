const AUDIO_STATUS = {
  play: "play",
  pause: "pause",
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

export { AUDIO_STATUS, PIXEL_RATIO, CANVAS_AUDIO_CHUNK, DEFAULT_AUDIO_INFO };
