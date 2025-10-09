import Project from "../project";
import AudioPlayer from "../audioPlayer";
import CanvasDraw from "../canvasDraw";
import PlayButton from "./playButton";
import { PIXEL_RATIO, AUDIO_STATUS } from "../config";

export default class AudioCanvas {
  static wrapper = document.querySelector("#canvas-wrapper");
  static spectrum = document.querySelector("#audio-canvas");
  static status = document.querySelector("#audio-status");

  static addListener() {
    this.status.addEventListener("click", (e) => AudioCanvas.seek(e));
  }

  static initHeight() {
    const height = this.wrapper.clientHeight;
    this.spectrum.height = height * PIXEL_RATIO;
    this.spectrum.style.height = `${height}px`;
    this.status.height = height * PIXEL_RATIO;
    this.status.style.height = `${height}px`;
  }

  static setWidth(width) {
    this.spectrum.width = width * PIXEL_RATIO;
    this.spectrum.style.width = `${width}px`;
    this.status.width = width * PIXEL_RATIO;
    this.status.style.width = `${width}px`;
  }

  static seek(event) {
    const offsetPixel = event.offsetX;
    const idx = AudioPlayer.current.idx;
    const info = Project.info[idx];
    const duration = info.audioData.duration;
    const offsetTime =
      (offsetPixel / event.target.width) * duration * PIXEL_RATIO;

    // 클릭한 지점이 노래 비활성화 지점이면 아무 일도 일어나지 않음
    if (offsetTime < info.audioStart || offsetTime > duration - info.audioEnd)
      return;

    AudioPlayer.seek(offsetTime);
    // 기존의 재생되고 있던 애니메이션은 종료함
    AudioPlayer.cancelOffset();
    const status = PlayButton.btn.dataset.status;
    if (status === AUDIO_STATUS.play) {
      const currentTime = AudioPlayer.current.context.currentTime;
      AudioPlayer.moveOffset(currentTime);
    } else if (status === AUDIO_STATUS.pause) {
      AudioPlayer.current.offset = offsetTime;
      CanvasDraw.drawStatus(offsetTime, null, null);
    }
  }
}
