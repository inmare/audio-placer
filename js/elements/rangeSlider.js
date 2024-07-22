import Project from "../project";
import AudioPlayer from "../audioPlayer";
import CanvasDraw from "../canvasDraw";
import { PIXEL_RATIO, RANGE_TYPE } from "../config";

export default class RangeSlider {
  static start = document.querySelector("#start-range");
  static end = document.querySelector("#end-range");

  constructor() {}

  static addListener() {
    this.start.addEventListener("input", (event) =>
      RangeSlider.changeValue(event, RANGE_TYPE.start)
    );
    this.end.addEventListener("input", (event) =>
      RangeSlider.changeValue(event, RANGE_TYPE.end)
    );
  }

  static changeValue(event, rangeType) {
    if (AudioPlayer.current.idx === null) return;

    const info = Project.info[AudioPlayer.current.idx];
    const duration = info.audioData.duration;

    const value = event.target.value;
    // end range의 경우에는 끝에서 얼만큼 줄어들었는지가 time에 저장됨
    // devicePixelRatio 값을 곱해줘야 정확한 수치가 나옴
    const time = ((duration / 2) * value) / 100 / PIXEL_RATIO;

    if (rangeType === RANGE_TYPE.start) {
      info.audioStart = time;
      if (AudioPlayer.current.offset < time) {
        AudioPlayer.current.offset = time;
      }
      CanvasDraw.drawStatus(null, time, null);
    } else if (rangeType === RANGE_TYPE.end) {
      info.audioEnd = time;
      if (AudioPlayer.current.offset > duration - time) {
        AudioPlayer.current.offset = duration - time;
      }
      CanvasDraw.drawStatus(null, null, time);
    }
  }

  static setValue(rangeType, value) {
    if (rangeType === RANGE_TYPE.start) {
      this.start.value = value;
    } else if (rangeType === RANGE_TYPE.end) {
      this.end.value = value;
    }
  }

  static disable() {
    this.start.disabled = true;
    this.end.disabled = true;
  }

  static enable() {
    this.start.disabled = false;
    this.end.disabled = false;
  }
}
