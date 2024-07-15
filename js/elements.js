import { AUDIO_STATUS, PIXEL_RATIO, SCROLL_POS, IMG_PATH } from "./config.js";
import CanvasDraw from "./canvasDraw.js";
import AudioPlayer from "./audioPlayer.js";
import Playlist from "./playlist.js";

export default class Elements {
  static audio = {
    playBtn: document.querySelector("#audio-play"),
    playBtnImg: document.querySelector("#audio-play img"),
    forwardBtn: document.querySelector("#move-forward"),
    backwardBtn: document.querySelector("#move-backward"),
    startRange: document.querySelector("#start-range"),
    endRange: document.querySelector("#end-range"),
  };
  static canvas = {
    wrapper: document.querySelector("#canvas-wrapper"),
    spectrum: document.querySelector("#audio-canvas"),
    status: document.querySelector("#audio-status"),
  };
  static playlist = {
    wrapper: document.querySelector("#playlist-wrapper"),
    selected: null,
    clicked: null,
    over: null,
  };
  static range = {
    start: document.querySelector("#start-range"),
    end: document.querySelector("#end-range"),
  };

  static init() {
    // 노래 관련 버튼들
    this.audio.playBtn.addEventListener("click", () => this.playMusic());
    this.audio.forwardBtn.addEventListener("click", () =>
      this.scrollTo(SCROLL_POS.start)
    );
    this.audio.backwardBtn.addEventListener("click", () =>
      this.scrollTo(SCROLL_POS.end)
    );
    // 캔버스 그리기
    this.initCanvasHeight();
    this.canvas.status.addEventListener("click", (e) => this.seekCanvas(e));
    // range input들
    this.range.start.addEventListener("input", (e) => this.setRange(e));
    this.range.end.addEventListener("input", (e) => this.setRange(e));
  }

  static playMusic() {
    // 현재 재생중인 노래가 없으면 종료
    if (AudioPlayer.current.idx === null) return;

    const playBtn = this.audio.playBtn;
    const status = playBtn.dataset.status;
    const img = this.audio.playBtnImg;
    switch (status) {
      case AUDIO_STATUS.pause:
        AudioPlayer.play(AudioPlayer.current.offset);
        CanvasDraw.reqId = requestAnimationFrame(
          CanvasDraw.drawOffsetAnimation.bind(CanvasDraw)
        );
        img.src = IMG_PATH.pause;
        playBtn.dataset.status = AUDIO_STATUS.play;
        break;
      case AUDIO_STATUS.play:
        // 재생을 멈추고 animtaion 재생도 멈춤
        AudioPlayer.stop();
        cancelAnimationFrame(CanvasDraw.reqId);
        CanvasDraw.reqId = null;
        CanvasDraw.drawStatus(AudioPlayer.current.offset, null, null);
        img.src = IMG_PATH.play;
        playBtn.dataset.status = AUDIO_STATUS.pause;
        break;
      default:
        break;
    }
  }

  static scrollTo(scrollPos) {
    // 현재 재생중인 노래가 없으면 종료
    if (AudioPlayer.current.idx === null) return;

    const wrapper = this.canvas.wrapper;
    let offset;
    switch (scrollPos) {
      case SCROLL_POS.start:
        offset = 0;
        break;
      case SCROLL_POS.end:
        offset = wrapper.scrollWidth;
      default:
        break;
    }
    wrapper.scrollLeft = offset;
  }

  static seekCanvas(e) {
    const offsetPixel = e.offsetX;
    const idx = AudioPlayer.current.idx;
    const duration = Playlist.list[idx].info.audioData.duration;
    const offsetTime = (offsetPixel / e.target.width) * duration * PIXEL_RATIO;

    AudioPlayer.seek(offsetTime);
    // 기존의 재생되고 있던 애니메이션은 종료함
    if (CanvasDraw.reqId) {
      cancelAnimationFrame(CanvasDraw.reqId);
      CanvasDraw.reqId = null;
    }
    const status = this.audio.playBtn.dataset.status;
    switch (status) {
      case AUDIO_STATUS.play:
        CanvasDraw.reqId = requestAnimationFrame(
          CanvasDraw.drawOffsetAnimation.bind(CanvasDraw)
        );
        break;
      case AUDIO_STATUS.pause:
        CanvasDraw.drawStatus(offsetTime, null, null);
      default:
        break;
    }
  }

  static initCanvasHeight() {
    const height = this.canvas.wrapper.clientHeight;
    this.canvas.spectrum.height = height * PIXEL_RATIO;
    this.canvas.spectrum.style.height = `${height}px`;
    this.canvas.status.height = height * PIXEL_RATIO;
    this.canvas.status.style.height = `${height}px`;
  }

  static setCanvasWidth(canvasWidth) {
    for (let [key, canvas] of Object.entries(this.canvas)) {
      if (key != "wrapper") {
        canvas.width = canvasWidth * PIXEL_RATIO;
        canvas.style.width = `${canvasWidth}px`;
      }
    }
  }

  static setRange(e) {
    if (AudioPlayer.current.idx === null) return;

    const info = Playlist.list[AudioPlayer.current.idx].info;
    const duration = info.audioData.duration;

    const name = e.target.name;
    const value = e.target.value;
    // end range의 경우에는 끝에서 얼만큼 줄어들었는지가 time에 저장됨
    // devicePixelRatio 값을 곱해줘야 정확한 수차기 나옴
    let time = ((duration / 2) * value) / 100 / PIXEL_RATIO;

    if (name == "start-range") {
      info.audioStart = time;
      CanvasDraw.drawStatus(null, time, null);
    } else if (name == "end-range") {
      info.audioEnd = time;
      CanvasDraw.drawStatus(null, null, time);
    }
  }
}
