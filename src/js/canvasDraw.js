import Project from "./project";
import AudioPlayer from "./audioPlayer";
import AudioCanvas from "./elements/audioCanvas";
import { PIXEL_RATIO, CANVAS_AUDIO_CHUNK } from "./config";

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
    const info = Project.info[idx];
    const audioData = info.audioData;
    const audioGain = info.audioGain;
    const channelData = AudioPlayer.getMonoChannelData(audioData);

    const chunk = CANVAS_AUDIO_CHUNK;
    const canvasWidth = Math.ceil(channelData.length / chunk);

    AudioCanvas.setWidth(canvasWidth);

    const canvas = AudioCanvas.spectrum;
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
      const factor = audioGain * 2;

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
    const info = Project.info[AudioPlayer.current.idx];
    const duration = info.audioData.duration;

    const offset = offsetTime ? offsetTime : AudioPlayer.current.offset;
    const start = startTime ? startTime : info.audioStart;
    const end = endTime ? endTime : info.audioEnd;

    const canvas = AudioCanvas.status;
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
