import AudioPlayer from "../audioPlayer";
import RangeSlider from "./rangeSlider";
import { AUDIO_STATUS, IMG_PATH } from "../config";

export default class PlayButton {
  static btn = document.querySelector("#audio-play");
  static img = document.querySelector("#audio-play img");

  static addListener() {
    this.btn.addEventListener("click", PlayButton.playMusic);
  }

  static setPlay() {
    this.btn.dataset.status = AUDIO_STATUS.play;
    this.img.src = IMG_PATH.pause;
  }

  static setPause() {
    this.btn.dataset.status = AUDIO_STATUS.pause;
    this.img.src = IMG_PATH.play;
  }

  static playMusic() {
    // 현재 재생중인 노래가 없으면 종료
    if (AudioPlayer.current.idx === null) return;

    const playBtn = PlayButton.btn;
    const status = playBtn.dataset.status;
    const musicUploadBtn = document.querySelector(
      `[data-id="${AudioPlayer.current.idx}"] .music-upload-btn`
    );

    if (status === AUDIO_STATUS.pause) {
      RangeSlider.disable();
      AudioPlayer.play(AudioPlayer.current.offset);
      const currentTime = AudioPlayer.current.context.currentTime;
      AudioPlayer.moveOffset(currentTime);
      PlayButton.setPlay();
      musicUploadBtn.classList.add("disabled-click");
    } else if (status === AUDIO_STATUS.play) {
      RangeSlider.enable();
      AudioPlayer.stop();
      AudioPlayer.cancelOffset();
      PlayButton.setPause();
      musicUploadBtn.classList.remove("disabled-click");
    }
  }
}
