import { AUDIO_STATUS, PIXEL_RATIO, CANVAS_AUDIO_CHUNK } from "./config.js";
import AudioPlayer from "./audioPlayer.js";
import Playlist from "./playlist.js";
import Utils from "./utils.js";

// TODO: 영상이 재생 중일 때 캔버스를 클릭해도 원하는 지점으로 이동해서 오디오 재생
// TODO: 오디오가 재생 중일 때 다른 오디오를 클릭하면 이전 오디오를 정지하고 초기화하기
// TODO: 캔버스를 그리는 함수와 오디오를 재생하는 함수를 분리하기
// TODO: 오디오의 시작지점 이전과 끝 지점 이후에 선택을 못하게 하고 재생도 자동으로 멈추게 하기

export default class CanvasDraw {
  static reqId = null;
  static elem = {
    wrapper: document.querySelector("#canvas-wrapper"),
    spectrum: document.querySelector("#audio-canvas"),
    status: document.querySelector("#audio-status"),
  };
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

  static init() {
    const height = this.elem.wrapper.clientHeight;
    this.elem.spectrum.height = height * PIXEL_RATIO;
    this.elem.spectrum.style.height = `${height * PIXEL_RATIO}px`;
    this.elem.status.height = height * PIXEL_RATIO;
    this.elem.status.style.height = `${height * PIXEL_RATIO}px`;
  }

  static async drawSpectrum(idx) {
    const info = Playlist.list[idx].info;
    const audioData = info.audioData;
    const audioInitGain = info.audioInitGain;
    const channelData = AudioPlayer.getMonoChannelData(audioData);

    const chunk = CANVAS_AUDIO_CHUNK;
    const canvasWidth = Math.ceil(channelData.length / chunk);

    this.setCanvasWidth(canvasWidth);

    const canvas = this.elem.spectrum;
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

      // const factor = 1;
      // 특정 이하의 값으로 dB가 내려가면 높이를 선으로 표시
      const h = avg < 0.005 ? 1 : avg * canvas.height * factor;
      ctx.fillRect(i, canvas.height / 2 - h / 2, 1, h);
    }
    // canvas의 마지막 부분에 선을 그어줌
    ctx.fillRect(canvas.width - 1, canvas.height / 2 - 2 / 2, 1, 2);
  }

  static drawStatus(offsetTime = null, startTime = null, endTime = null) {
    const idx = AudioPlayer.current.idx;
    const info = Playlist.list[idx].info;
    const duration = info.audioData.duration;

    const offset = offsetTime ? offsetTime : AudioPlayer.current.offset;
    const start = startTime ? startTime : info.audioStart;
    const end = endTime ? endTime : info.audioEnd;

    // console.log(offsetTime, startTime, endTime);
    // console.log(offset, start, end);

    const canvas = this.elem.status;
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

  static drawOffsetAnimation() {
    const currentTime = AudioPlayer.current.context.currentTime;
    const startTime = AudioPlayer.current.start;
    const offsetTime = currentTime - startTime;

    this.drawStatus(offsetTime, null, null);
    this.reqId = requestAnimationFrame(this.drawOffsetAnimation.bind(this));
  }

  // --- utils functions ---
  static setCanvasWidth(canvasWidth) {
    const spectrumCanvas = this.elem.spectrum;
    const statusCanvas = this.elem.status;
    spectrumCanvas.width = canvasWidth;
    spectrumCanvas.style.width = `${canvasWidth * PIXEL_RATIO}px`;
    statusCanvas.width = canvasWidth;
    statusCanvas.style.width = `${canvasWidth * PIXEL_RATIO}px`;
  }

  static timeToPx(time, duration, canvasWidth) {
    return (time / duration) * canvasWidth;
  }

  // static playAudio(e) {
  //   const audioPlayBtn = CanvasDraw.audioPlayBtn;
  //   const status = audioPlayBtn.dataset.status;
  //   const currentAudioIdx = CanvasDraw.currentAudioIdx;

  //   const audioContext = CanvasDraw.audioContext;

  //   if (currentAudioIdx !== null) {
  //     // let reqId;
  //     if (status === AUDIO_STATUS.pause) {
  //       const info = Playlist.list[currentAudioIdx].info;
  //       CanvasDraw.audioSource = audioContext.createBufferSource();

  //       CanvasDraw.audioSource.buffer = info.audioData;
  //       const gainNode = audioContext.createGain();
  //       // 실제보다 살짝 작은 볼륨으로 재생
  //       gainNode.gain.value = info.initGain / 3;

  //       CanvasDraw.audioSource.connect(gainNode);
  //       gainNode.connect(audioContext.destination);

  //       // AudioCanvas.audioSource.connect(audioAnalyser);

  //       CanvasDraw.audioSource.start(0, CanvasDraw.audioOffset);
  //       CanvasDraw.audioStartTime = audioContext.currentTime;
  //       const img = audioPlayBtn.querySelector("img");
  //       img.src = "img/pause-solid.svg";
  //       audioPlayBtn.dataset.status = AUDIO_STATUS.play;
  //       CanvasDraw.reqId = requestAnimationFrame(CanvasDraw.drawAudioOffset);

  //       CanvasDraw.audioSource.onended = () => {
  //         // AudioCanvas.audioOffset = 0;
  //         const img = audioPlayBtn.querySelector("img");
  //         img.src = "img/play-solid.svg";
  //         audioPlayBtn.dataset.status = AUDIO_STATUS.pause;
  //         // cancelAnimationFrame(reqId);
  //       };
  //     } else {
  //       CanvasDraw.audioSource.stop();
  //       CanvasDraw.audioOffset +=
  //         audioContext.currentTime - CanvasDraw.audioStartTime;
  //       cancelAnimationFrame(CanvasDraw.reqId);
  //       CanvasDraw.audioSource = null;
  //       const img = audioPlayBtn.querySelector("img");
  //       img.src = "img/play-solid.svg";
  //       audioPlayBtn.dataset.status = AUDIO_STATUS.pause;
  //     }
  //   }
  // }

  // static seekAudio(e) {
  //   const currentIdx = CanvasDraw.currentAudioIdx;
  //   if (currentIdx !== null) {
  //     const audioStatus = CanvasDraw.audioStatus;
  //     const offsetX = e.offsetX;
  //     const canvasWidth = audioStatus.width;
  //     const canvasHeight = audioStatus.height;

  //     const info = Playlist.list[currentIdx].info;

  //     const duration = info.audioData.duration;
  //     const seekTime = (offsetX / canvasWidth) * duration;
  //     CanvasDraw.audioOffset = seekTime;

  //     const ctx = audioStatus.getContext("2d");
  //     ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  //     const statusBarColor = window
  //       .getComputedStyle(document.body)
  //       .getPropertyValue("--status-bar-color");
  //     ctx.fillStyle = statusBarColor;
  //     ctx.fillRect(offsetX, 0, 1, canvasHeight);
  //   }
  // }

  // static drawAudioCanvas() {
  //   const currentAudioIdx = CanvasDraw.currentAudioIdx;
  //   const info = Playlist.list[currentAudioIdx].info;
  //   const audioData = info.audioData;
  //   const initGain = info.initGain;
  //   const channelData = Utils.getMonoChannelData(audioData);

  //   const chunk = CANVAS_AUDIO_CHUNK;
  //   const canvasWidth = Math.ceil(channelData.length / chunk);
  //   const audioCanvas = CanvasDraw.audioCanvas;
  //   const audioStatus = CanvasDraw.audioStatus;
  //   audioCanvas.width = canvasWidth;
  //   audioCanvas.style.width = `${canvasWidth * PIXEL_RATIO}px`;
  //   audioStatus.width = canvasWidth;
  //   audioStatus.style.width = `${canvasWidth * PIXEL_RATIO}px`;

  //   const style = window.getComputedStyle(document.body);
  //   const spectrumColor = style.getPropertyValue("--color-950");

  //   const canvasCtx = audioCanvas.getContext("2d");
  //   canvasCtx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
  //   canvasCtx.fillStyle = spectrumColor;

  //   let dataIdx = 0;

  //   for (let i = 0; i < canvasWidth; i++) {
  //     let sum = 0;
  //     for (let j = 0; j < chunk; j++) {
  //       sum += Math.abs(channelData[dataIdx]);
  //       dataIdx++;
  //     }
  //     const avg = sum / chunk;
  //     const factor = initGain * 2;
  //     // const factor = 1;
  //     // 특정 이하의 값으로 dB가 내려가면 높이를 선으로 표시
  //     const h = avg < 0.005 ? 1 : avg * audioCanvas.height * factor;
  //     // if (i > 200 && i < 210) {
  //     //   console.log(sum, avg, h);
  //     // }
  //     canvasCtx.fillRect(i, audioCanvas.height / 2 - h / 2, 1, h);
  //   }
  //   // canvas의 마지막 부분에 선을 그어줌
  //   canvasCtx.fillRect(
  //     audioCanvas.width - 1,
  //     audioCanvas.height / 2 - 2 / 2,
  //     1,
  //     2
  //   );

  //   const statusCtx = audioStatus.getContext("2d");
  //   statusCtx.clearRect(0, 0, audioStatus.width, audioStatus.height);
  //   const statusBarColor = style.getPropertyValue("--status-bar-color");
  //   statusCtx.fillStyle = statusBarColor;
  //   statusCtx.fillRect(0, 0, 1, audioStatus.height);
  // }

  // static drawAudioOffset() {
  //   const currentTime = CanvasDraw.audioContext.currentTime;
  //   const startTime = CanvasDraw.audioStartTime;
  //   const offset = CanvasDraw.audioOffset + currentTime - startTime;
  //   const duration = CanvasDraw.audioSource.buffer.duration;

  //   const audioStatus = CanvasDraw.audioStatus;
  //   const canvasWidth = audioStatus.width;
  //   const canvasHeight = audioStatus.height;
  //   const offsetCanvasX = canvasWidth * (offset / duration);

  //   const ctx = audioStatus.getContext("2d");
  //   ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  //   const statusBarColor = window
  //     .getComputedStyle(document.body)
  //     .getPropertyValue("--status-bar-color");
  //   ctx.fillStyle = statusBarColor;
  //   ctx.fillRect(offsetCanvasX, 0, 1, canvasHeight);

  //   CanvasDraw.reqId = requestAnimationFrame(CanvasDraw.drawAudioOffset);
  // }

  // static drawAudioDeselectRegion(e) {
  //   const currentAudioIdx = CanvasDraw.currentAudioIdx;
  //   if (currentAudioIdx !== null) {
  //     const info = Playlist.list[currentAudioIdx].info;
  //     const audioData = info.audioData;
  //     const duration = audioData.duration;
  //     const percent = parseFloat(e.target.value);
  //     const type = e.target.name;
  //     let time;
  //     if (type == "start-range") {
  //       time = ((duration / 2) * percent) / 100;
  //       info.startTime = time;
  //     } else if (type == "end-range") {
  //       time = duration - ((duration / 2) * percent) / 100;
  //       info.endTime = time;
  //     }

  //     // console.table(info.startTime, info.endTime);
  //     const canvas = CanvasDraw.audioStatus;
  //     const width = canvas.width;
  //     const height = canvas.height;

  //     const startTimePixel =
  //       info?.startTime !== undefined ? (info.startTime / duration) * width : 0;
  //     const endTimePixel =
  //       info?.endTime !== undefined ? (info.endTime / duration) * width : width;

  //     // console.log(startTimePixel, endTimePixel);
  //     const ctx = canvas.getContext("2d");
  //     ctx.clearRect(0, 0, width, height);

  //     const deselectRegionColor = window
  //       .getComputedStyle(document.body)
  //       .getPropertyValue("--deselect-region-color");

  //     ctx.fillStyle = deselectRegionColor;
  //     ctx.fillRect(0, 0, startTimePixel, height);
  //     ctx.fillRect(endTimePixel, 0, width, height);

  //     const statusBarColor = window
  //       .getComputedStyle(document.body)
  //       .getPropertyValue("--status-bar-color");
  //     ctx.fillStyle = statusBarColor;
  //     const offset = CanvasDraw.audioOffset;
  //     const offsetPixel = (offset / duration) * width;
  //     ctx.fillRect(offsetPixel, 0, 1, height);
  //   }
  // }
}
