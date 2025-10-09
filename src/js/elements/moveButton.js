import AudioPlayer from "../audioPlayer";
import AudioCanvas from "./audioCanvas";
import { SCROLL_POS } from "../config";

export default class MoveButton {
  static forward = document.querySelector("#move-forward");
  static backward = document.querySelector("#move-backward");

  constructor() {}

  static addListener() {
    this.forward.addEventListener("click", (event) =>
      MoveButton.scrollTo(event, SCROLL_POS.start)
    );
    this.backward.addEventListener("click", (event) =>
      MoveButton.scrollTo(event, SCROLL_POS.end)
    );
  }

  static scrollTo(event, scrollPos) {
    event.preventDefault();
    // 현재 재생중인 노래가 없으면 종료
    if (AudioPlayer.current.idx === null) return;

    let offset;
    if (scrollPos === SCROLL_POS.start) {
      offset = 0;
    } else if (scrollPos === SCROLL_POS.end) {
      offset = AudioCanvas.wrapper.scrollWidth;
    }
    AudioCanvas.wrapper.scrollLeft = offset;
  }
}
