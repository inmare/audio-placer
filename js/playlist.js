import AudioPlayer from "./audioPlayer";
import CanvasDraw from "./canvasDraw";
import Utils from "./utils";
import { AUDIO_STATUS, IMG_PATH, MOVE_TYPE } from "./config";
import Elements from "./elements";

export default class Playlist {
  static list = [];

  constructor(infoObj, infoIdx) {
    this.info = infoObj;
    this.div = this.createDiv(infoObj, infoIdx);
  }

  async click(e) {
    const btn = e.target.closest(".btn");
    if (btn) return;

    const target = e.target.closest(".playlist-item");
    const idx = parseInt(target.dataset.id);

    Playlist.initMusic(idx);

    const items = document.querySelectorAll(".playlist-item");

    for (let item of items) {
      if (item.classList.contains("item-clicked")) {
        item.classList.remove("item-clicked");
      }
    }

    target.classList.add("item-clicked");
    Elements.playlist.clicked = target;

    // audioData가 없으면 canvas의 너비를 0으로 설정
    const info = Playlist.list[idx].info;
    if (info.audioData === null) {
      Elements.setCanvasWidth(0);
    }
  }

  createDiv(info, idx) {
    const div = document.createElement("div");
    const divContent = document
      .querySelector("#playlist-item-template")
      .content.cloneNode(true);
    div.draggable = true;
    div.append(divContent);
    div.classList.add("playlist-item");

    const title = div.querySelector(".music-title");
    title.textContent = info.songNameKor;

    const order = div.querySelector(".music-order");
    order.textContent = idx + 1;

    Elements.playlist.wrapper.append(div);
    div.setAttribute("data-id", idx);

    div.addEventListener("click", this.click);

    const musicUploadBtn = div.querySelector(".music-upload-btn");
    const moveUpBtn = div.querySelector(".move-up");
    const moveDownBtn = div.querySelector(".move-down");
    const fileUploadInput = div.querySelector('input[type="file"]');

    musicUploadBtn.addEventListener("click", () => {
      fileUploadInput.click();
    });

    moveUpBtn.addEventListener("click", (e) =>
      Playlist.moveItem(e, MOVE_TYPE.up)
    );
    moveDownBtn.addEventListener("click", (e) =>
      Playlist.moveItem(e, MOVE_TYPE.down)
    );
    fileUploadInput.addEventListener("change", (e) =>
      Playlist.uploadMusicFile(e)
    );

    return div;
  }

  static addDragEventListeners() {
    Elements.playlist.wrapper.addEventListener("dragstart", dragStart);
    Elements.playlist.wrapper.addEventListener("dragover", dragOver);
    Elements.playlist.wrapper.addEventListener("dragend", dragEnd);

    function dragStart(e) {
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
      Playlist.changeMusicOrder();
    }
  }

  static initMusic(idx) {
    const info = Playlist.list[idx].info;

    // 클릭한 노래의 audioData가 없는 경우 아무일도 일어나지 않음
    if (info.audioData === null) return;
    AudioPlayer.current.idx = idx;

    const duration = info.audioData.duration;
    const startTime = info.audioStart;
    const endTime = info.audioEnd;

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

    CanvasDraw.drawSpectrum(idx);
    // 새로 데이터를 로드하는 경우 offsetTime을 초기화
    // startTime을 offsetTime의 초기값으로 설정
    const offsetTime = Playlist.list[idx].info.audioStart;
    AudioPlayer.current.offset = offsetTime;
    CanvasDraw.drawStatus(offsetTime, null, null);

    Elements.range.start.value = (startTime / (duration / 2)) * 100;
    Elements.range.end.value = (endTime / (duration / 2)) * 100;
  }

  static changeMusicOrder() {
    const items = document.querySelectorAll(".playlist-item");
    for (let item of items) {
      const musicOrder = item.querySelector(".music-order");
      const idx = Array.from(items).indexOf(item);
      musicOrder.textContent = idx + 1;
    }
  }

  static moveItem(e, moveType) {
    const items = document.querySelectorAll(".playlist-item");
    const target = e.target.closest(".playlist-item");
    const targetIdx = Array.from(items).indexOf(target);
    if (targetIdx == 0 && moveType == MOVE_TYPE.up) return;
    if (targetIdx == items.length - 1 && moveType == MOVE_TYPE.down) return;

    let beforeElem;
    switch (moveType) {
      case MOVE_TYPE.up:
        beforeElem = items[targetIdx - 1];
        break;
      case MOVE_TYPE.down:
        beforeElem = items[targetIdx + 2];
        break;
      default:
        break;
    }

    target.parentNode.insertBefore(target, beforeElem);
    Playlist.changeMusicOrder();
  }

  static uploadMusicFile(e) {
    const file = e.target.files[0];
    const target = e.target.closest(".playlist-item");
    const idx = parseInt(target.dataset.id);
    const reader = new FileReader();
    reader.onload = async function () {
      const audioBuffer = reader.result;
      await AudioPlayer.setSource(idx, audioBuffer);
      const fileName = file.name;
      const playlistItem = e.target.closest(".playlist-item");
      const musicfileName = playlistItem.querySelector(".music-file-name");
      musicfileName.textContent = fileName;
      const target = e.target.closest(".playlist-item");
      Playlist.initMusic(idx);
    };
    reader.readAsArrayBuffer(file);
  }
}
