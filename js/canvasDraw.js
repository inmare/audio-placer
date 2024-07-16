import { AUDIO_STATUS, PIXEL_RATIO, CANVAS_AUDIO_CHUNK } from "./config.js";
import AudioPlayer from "./audioPlayer.js";
import Playlist from "./playlist.js";
import Utils from "./utils.js";
import Elements from "./elements.js";

// TODO: 영상이 재생 중일 때 캔버스를 클릭해도 원하는 지점으로 이동해서 오디오 재생
// TODO: 오디오가 재생 중일 때 다른 오디오를 클릭하면 이전 오디오를 정지하고 초기화하기
// TODO: 캔버스를 그리는 함수와 오디오를 재생하는 함수를 분리하기
// TODO: 오디오의 시작지점 이전과 끝 지점 이후에 선택을 못하게 하고 재생도 자동으로 멈추게 하기

export default class CanvasDraw {
  static color = {
    spectrum: window
      .getComputedStyle(document.body)
      .getPropertyValue("--color-950"),
    offset: window
      .getComputedStyle(document.body)
      .getPropertyValue("--status-bar-color"),
    diselect: window
      .getComputedStyle(document.body)
      .getPropertyValue("--deselect-region-color"),
  };

  constructor() {}

  static drawSpectrum(idx) {
    const info = Playlist.list[idx].info;
    const audioData = info.audioData;
    const audioInitGain = info.audioInitGain;
    const channelData = AudioPlayer.getMonoChannelData(audioData);

    const chunk = CANVAS_AUDIO_CHUNK;
    const canvasWidth = Math.ceil(channelData.length / chunk);

    Elements.setCanvasWidth(canvasWidth);

    const canvas = Elements.canvas.spectrum;
    const ctx = canvas.getContext("2d");
    const color = this.color.spectrum;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;

    let dataIdx = 0;

    for (let i = 0; i < canvas.width; i++) {
      let sum = 0;
      for (let j = 0; j < chunk; j++) {
        sum += Math.abs(channelData[dataIdx]);
        dataIdx++;
      }
      const avg = sum / chunk;
      const factor = audioInitGain * 2;

      // 특정 이하의 값으로 dB가 내려가면 높이를 선으로 표시
      const h = avg < 0.005 ? 1 : avg * canvas.height * factor;
      ctx.fillRect(i * PIXEL_RATIO, canvas.height / 2 - h / 2, PIXEL_RATIO, h);
    }
    // canvas의 마지막 부분에 선을 그어줌
    ctx.fillRect(
      canvas.width - PIXEL_RATIO,
      canvas.height / 2 - 2 / 2,
      PIXEL_RATIO,
      2
    );
  }

  static drawStatus(offsetTime = null, startTime = null, endTime = null) {
    const idx = AudioPlayer.current.idx;
    const info = Playlist.list[idx].info;
    const duration = info.audioData.duration;

    const offset = offsetTime ? offsetTime : AudioPlayer.current.offset;
    const start = startTime ? startTime : info.audioStart;
    const end = endTime ? endTime : info.audioEnd;

    const canvas = Elements.canvas.status;
    const ctx = canvas.getContext("2d");
    const offsetPx = this.timeToPx(offset, duration, canvas.width);
    const startPx = this.timeToPx(start, duration, canvas.width);
    const endPx = this.timeToPx(end, duration, canvas.width);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = this.color.diselect;
    ctx.fillRect(0, 0, startPx, canvas.height);
    ctx.fillRect(canvas.width - endPx, 0, endPx, canvas.height);
    ctx.fillStyle = this.color.offset;
    ctx.fillRect(offsetPx, 0, 1, canvas.height);
  }

  // --- utils functions ---
  static timeToPx(time, duration, canvasWidth) {
    return (time / duration) * canvasWidth;
  }
}
