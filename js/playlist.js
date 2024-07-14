import AudioPlayer from "./audioPlayer";
import CanvasDraw from "./canvasDraw";
import Utils from "./utils";

export default class Playlist {
  static list = [];
  static wrapperElem = document.querySelector("#playlist-wrapper");
  static currentOverElem = null;
  static selectedElem = null;
  static clickedElem = null;
  static elem = {
    wrapper: document.querySelector("#playlist-wrapper"),
    over: null,
    selected: null,
    clicked: null,
  };

  constructor(infoObj, infoIdx) {
    this.info = infoObj;
    this.div = this.createDiv(infoObj, infoIdx);
  }

  async click(e) {
    e.preventDefault();
    const target = e.target.closest(".playlist-item");
    const clicked = Playlist.clickedElem;
    const idx = parseInt(target.dataset.id);
    if (!clicked) {
      await init(target, idx);
    } else {
      if (clicked != target) {
        const items = document.querySelectorAll(".playlist-item");
        for (let item of items) {
          if (item.classList.contains("item-clicked")) {
            item.classList.remove("item-clicked");
          }
        }
        await init(target, idx);
      } else {
        target.classList.remove("item-clicked");
        Playlist.clickedElem = null;
      }
    }

    async function init(target, idx) {
      target.classList.add("item-clicked");
      Playlist.clickedElem = target;
      await AudioPlayer.setSource(idx);
      CanvasDraw.drawSpectrum(idx);
      // 새로 데이터를 로드하는 경우 offsetTime을 초기화
      // startTime을 offsetTime의 초기값으로 설정
      const offsetTime = Playlist.list[idx].info.audioStart;
      AudioPlayer.current.offset = offsetTime;
      CanvasDraw.drawStatus(offsetTime, null, null);
    }
  }

  createDiv(info, idx) {
    const div = document.createElement("div");
    div.classList.add("playlist-item");
    div.setAttribute("draggable", "true");
    div.setAttribute("data-id", idx.toString());
    div.addEventListener("click", this.click);
    Playlist.wrapperElem.appendChild(div);

    const innerDiv = document.createElement("div");
    innerDiv.textContent = info.songNameKor;
    div.appendChild(innerDiv);
    return div;
  }

  static addDragEventListeners() {
    this.wrapperElem.addEventListener("dragstart", dragStart);
    this.wrapperElem.addEventListener("dragover", dragOver);
    this.wrapperElem.addEventListener("dragend", dragEnd);

    function dragStart(e) {
      const clicked = Playlist.clickedElem;
      if (clicked) {
        clicked.classList.remove("item-clicked");
      }
      Playlist.selectedElem = Utils.getOverElement(e);
      const selected = Playlist.selectedElem;
      // console.log("start");
      if (selected) {
        selected.classList.add("item-selected");
      }
    }

    function dragOver(e) {
      e.preventDefault();
      // console.log("over");
      const overElem = Utils.getOverElement(e);
      const currentOver = Playlist.currentOverElem;
      const selected = Playlist.selectedElem;
      if (overElem != currentOver) {
        if (currentOver) {
          currentOver.classList.remove("item-over");
        }
        if (overElem != selected) {
          overElem?.classList.add("item-over");
          Playlist.currentOverElem = overElem;
        }
      }
    }

    function dragEnd(e) {
      // console.log("end");
      const wrapper = Playlist.wrapperElem;
      const currentOver = Playlist.currentOverElem;
      const selected = Playlist.selectedElem;
      if (this == wrapper) {
        if (selected) selected.classList.remove("item-selected");
        if (currentOver) {
          currentOver.classList.remove("item-over");
          const parentElem = currentOver.parentNode;
          parentElem.insertBefore(selected, currentOver);
        }
      }
      Playlist.currentOverElem = null;
      Playlist.selectedElem = null;
    }
  }
}
