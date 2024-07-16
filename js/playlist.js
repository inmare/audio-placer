import AudioPlayer from "./audioPlayer";
import CanvasDraw from "./canvasDraw";
import Utils from "./utils";
import { AUDIO_STATUS, IMG_PATH } from "./config";
import Elements from "./elements";

export default class Playlist {
  static list = [];

  constructor(infoObj, infoIdx) {
    this.info = infoObj;
    this.div = this.createDiv(infoObj, infoIdx);
  }

  async click(e) {
    e.preventDefault();
    const target = e.target.closest(".playlist-item");
    // const clicked = Elements.playlist.clicked;
    const idx = parseInt(target.dataset.id);
    const items = document.querySelectorAll(".playlist-item");
    for (let item of items) {
      if (item.classList.contains("item-clicked")) {
        item.classList.remove("item-clicked");
      }
    }
    await init(target, idx);

    async function init(target, idx) {
      target.classList.add("item-clicked");
      Elements.playlist.clicked = target;
      // 기존의 노래와 애니메이션을 삭제함
      if (AudioPlayer.current.source) {
        AudioPlayer.current.source.stop();
        AudioPlayer.current.source = null;
        // range 슬라이더 활성화
        Elements.range.start.disabled = false;
        Elements.range.end.disabled = false;
      }
      if (AudioPlayer.reqId) {
        cancelAnimationFrame(AudioPlayer.reqId);
        AudioPlayer.reqId = null;
      }
      const playBtn = Elements.audio.playBtn;
      if (playBtn.dataset.status === AUDIO_STATUS.play) {
        playBtn.dataset.status = AUDIO_STATUS.pause;
        playBtn.querySelector("img").src = IMG_PATH.play;
      }

      await AudioPlayer.setSource(idx);
      CanvasDraw.drawSpectrum(idx);
      // 새로 데이터를 로드하는 경우 offsetTime을 초기화
      // startTime을 offsetTime의 초기값으로 설정
      const offsetTime = Playlist.list[idx].info.audioStart;
      AudioPlayer.current.offset = offsetTime;
      CanvasDraw.drawStatus(offsetTime, null, null);

      const info = Playlist.list[idx].info;
      const duration = info.audioData.duration;
      const startTime = info.audioStart;
      const endTime = info.audioEnd;
      Elements.range.start.value = (startTime / (duration / 2)) * 100;
      Elements.range.end.value = (endTime / (duration / 2)) * 100;
    }
  }

  createDiv(info, idx) {
    const div = document.createElement("div");
    div.classList.add("playlist-item");
    div.setAttribute("draggable", "true");
    div.setAttribute("data-id", idx.toString());
    div.addEventListener("click", this.click);
    Elements.playlist.wrapper.appendChild(div);

    const innerDiv = document.createElement("div");
    innerDiv.textContent = info.songNameKor;
    div.appendChild(innerDiv);
    return div;
  }

  static addDragEventListeners() {
    Elements.playlist.wrapper.addEventListener("dragstart", dragStart);
    Elements.playlist.wrapper.addEventListener("dragover", dragOver);
    Elements.playlist.wrapper.addEventListener("dragend", dragEnd);
    // Elements.playlist.wrapper.addEventListener("drop", dragEnd);

    function dragStart(e) {
      const clicked = Elements.playlist.clicked;
      // if (clicked) clicked.classList.remove("item-clicked");

      Elements.playlist.selected = Utils.getOverElement(e);
      const selected = Elements.playlist.selected;
      if (selected) selected.classList.add("item-selected");
    }

    function dragOver(e) {
      e.preventDefault();
      const overElem = Utils.getOverElement(e);
      const currentOver = Elements.playlist.over;
      const selected = Elements.playlist.selected;
      if (overElem != currentOver) {
        if (currentOver) {
          currentOver.classList.remove("item-over");
        }
        if (overElem != selected) {
          overElem?.classList.add("item-over");
          Elements.playlist.over = overElem;
        }
      }
    }

    function dragEnd(e) {
      const wrapper = Elements.playlist.wrapper;
      const currentOver = Elements.playlist.over;
      const selected = Elements.playlist.selected;
      if (this == wrapper) {
        if (selected) selected.classList.remove("item-selected");
        if (currentOver) {
          currentOver.classList.remove("item-over");
          const parentElem = currentOver.parentNode;
          parentElem.insertBefore(selected, currentOver);
        }
      }
      Elements.playlist.over = null;
      Elements.playlist.clicked = null;
    }
  }
}
