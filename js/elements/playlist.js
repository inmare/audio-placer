import Project from "../project";
import AudioPlayer from "../audioPlayer";
import CanvasDraw from "../canvasDraw";
import RangeSlider from "./rangeSlider";
import AudioCanvas from "./audioCanvas";
import PlayButton from "./playButton";
import { MOVE_TYPE, RANGE_TYPE } from "../config";

/**
 * 아이템을 클릭하면 관련 이벤트를 처리하는 함수
 */
function itemClickHandle(event) {
  const btn = event.target.closest(".btn");
  if (btn) return;

  const target = event.target.closest(".playlist-item");
  // 클릭한 요소가 이미 클릭된 요소라면 아무일도 일어나지 않음
  if (target == Playlist.clicked) return;

  const items = document.querySelectorAll(".playlist-item");
  for (let item of items) {
    if (item.classList.contains("item-clicked")) {
      item.classList.remove("item-clicked");
    }
    const fileUploadBtn = item.querySelector(".music-upload-btn");
    if (fileUploadBtn.classList.contains("disabled-click"))
      fileUploadBtn.classList.remove("disabled-click");
  }

  target.classList.add("item-clicked");
  Playlist.clicked = target;

  // 클릭하면 일어나야 할 일
  // 1. 노래 데이터를 가져와서 캔버스에 그림
  // 2. 이때 기존노래가 재생중이면 멈춰야 함
  // 3. 그런데 클릭한 요소가 기존에 클릭된 요소라면 아무일도 일어나지 않음
  // 4. 클릭한 요소에 audioData가 없으면 canvas의 너비를 0으로 설정

  const idx = parseInt(target.dataset.id);
  const info = Project.info[idx];

  stopPlayer(info);
  if (info.audioData !== null) {
    setPlayer(idx, info);
  }
}

/**
 * 노래를 멈추고 관련된 정보들을 리셋하는 함수 함수
 * @param {Object} info 노래 정보
 */
function stopPlayer(info) {
  // 기존의 노래와 애니메이션을 삭제함
  if (AudioPlayer.current.source) {
    AudioPlayer.current.source.stop();
    AudioPlayer.current.source = null;
    // range 슬라이더 활성화
    RangeSlider.enable();
  }
  AudioPlayer.cancelOffset();
  // playBtn이 play상태인 경우 pause로 변경
  PlayButton.setPause();

  // audioData가 없으면 canvas의 너비를 0으로 설정후 종료
  if (info.audioData === null) AudioCanvas.setWidth(0);
}

/**
 * 노래와 관련된 화면과 정보를 세팅하는 함수
 * @param {Number} idx 노래 인덱스
 * @param {Object} info 노래 정보
 */
function setPlayer(idx, info) {
  AudioPlayer.current.idx = idx;

  const duration = info.audioData.duration;
  const startTime = info.audioStart;
  const endTime = info.audioEnd;

  CanvasDraw.drawSpectrum(idx);
  // 새로 데이터를 로드하는 경우 offsetTime을 초기화
  // startTime을 offsetTime의 초기값으로 설정
  const offsetTime = info.audioStart;
  AudioPlayer.current.offset = offsetTime;
  CanvasDraw.drawStatus(offsetTime, null, null);

  RangeSlider.setValue(RANGE_TYPE.start, (startTime / (duration / 2)) * 100);
  RangeSlider.setValue(RANGE_TYPE.end, (endTime / (duration / 2)) * 100);
}

/**
 * 아이템 드래그 시작 이벤트 처리 함수
 * @param {Event} event 드래그 시작 이벤트
 */
function itemDragStart(event) {
  Playlist.selected = getOverElement(event);
  if (Playlist.selected) {
    Playlist.selected.classList.add("item-selected");
  }
}

/**
 * 아이템 드래그 오버 이벤트 처리 함수
 * @param {Evnet} event 드래그 오버 이벤트
 */
function itemDragOver(event) {
  event.preventDefault();
  const overElem = getOverElement(event);
  const over = Playlist.over;
  const selected = Playlist.selected;
  if (overElem != over) {
    if (over) {
      over.classList.remove("item-over");
    }
    if (overElem != selected) {
      overElem?.classList.add("item-over");
      Playlist.over = overElem;
    }
  }
}

/**
 * 아이템 드래그 종료 이벤트 처리 함수
 * @param {Event} _ 드래그 종료 이벤트
 */
function itemDragEnd(_) {
  const playlist = Playlist.playlist;
  const over = Playlist.over;
  const selected = Playlist.selected;
  if (this == playlist) {
    if (selected) selected.classList.remove("item-selected");
    if (over) {
      over.classList.remove("item-over");
      const parentElem = over.parentNode;
      parentElem.insertBefore(selected, over);
    }
  }
  Playlist.over = null;
  // 드래그가 끝나면 노래 순서를 다시 정렬함
  changeMusicOrder();
}

/**
 * 아이템을 위로 또는 아래로 이동시키는 함수
 * @param {Evnet} event 이벤트 객체
 * @param {String} moveType up or down, 어느 방향으로 움직일 것인지 결정
 * @returns
 */
function moveItem(event, moveType) {
  const items = document.querySelectorAll(".playlist-item");
  const target = event.target.closest(".playlist-item");
  const targetIdx = Array.from(items).indexOf(target);
  if (targetIdx == 0 && moveType == MOVE_TYPE.up) return;
  if (targetIdx == items.length - 1 && moveType == MOVE_TYPE.down) return;

  let beforeElem;

  if (moveType == MOVE_TYPE.up) {
    beforeElem = items[targetIdx - 1];
  } else if (moveType == MOVE_TYPE.down) {
    beforeElem = items[targetIdx + 1];
  }

  target.parentNode.insertBefore(target, beforeElem);
  changeMusicOrder();
}

/**
 * 현재 마우스 아래에 있는 playlist item을 반환하는 함수
 * @param {Event} event 마우스 클릭 이벤트
 * @returns {Element} playlist item, 없으면 null을 반환함
 */
function getOverElement(event) {
  const x = event.clientX;
  const y = event.clientY;
  const items = document.querySelectorAll(".playlist-item");
  for (let item of items) {
    const rect = item.getBoundingClientRect();
    if (rect.left < x && x < rect.right && rect.top < y && y < rect.bottom) {
      return item;
    }
  }
  return null;
}

/**
 * 개별 playlist item에 mp3파일을 업로드하는 함수
 * @param {Event} event 이벤트 객체
 */
function uploadMusicFile(event) {
  const file = event.target.files[0];
  const target = event.target.closest(".playlist-item");
  const idx = parseInt(target.dataset.id);
  const reader = new FileReader();
  reader.onload = async function () {
    const audioBuffer = reader.result;
    await AudioPlayer.setSource(idx, audioBuffer);
    updateFileName(file.name);
    // 노래를 업로드 할 때 일어나는 작업
    // 1. 현재 노래를 업로드하는 항목이 클릭된 항목인지 확인
    // 2. 만약에 클릭이 안되어있다면 그냥 info의 audio 관련 항목들만 업데이트
    // 3. 만약 클릭이 되어있다면 2번 작업 이후 추가적인 업데이트 필요
    // 3-1. canvas와 range 값 업데이트하기
    if (Playlist.clicked === target) setPlayer(idx, Project.info[idx]);
  };
  reader.readAsArrayBuffer(file);

  function updateFileName(fileName) {
    const musicfileName = target.querySelector(".music-file-name");
    musicfileName.textContent = fileName;
  }
}

/**
 * Playlist의 노래 순서를 다시 정렬해서 표시하는 함수
 */
function changeMusicOrder() {
  const items = document.querySelectorAll(".playlist-item");
  Array.from(items).forEach((item, idx) => {
    const musicOrder = item.querySelector(".music-order");
    musicOrder.textContent = (idx + 1).toString();
  });
}

export default class Playlist {
  static playlist = document.querySelector("#playlist-wrapper");
  static selected = null;
  static clicked = null;
  static over = null;

  constructor() {}

  /**
   * 노래 정보에 대해서 div를 생성하고 dom에 추가하는 함수
   * @param {Object} info 노래 정보
   * @param {Number} idx 노래 인덱스
   */
  static createDiv(info, idx) {
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

    Playlist.playlist.append(div);
    div.setAttribute("data-id", idx);
    div.addEventListener("click", itemClickHandle);

    // div 구성요소들에 event listener 추가
    const musicUploadBtn = div.querySelector(".music-upload-btn");
    const moveUpBtn = div.querySelector(".move-up");
    const moveDownBtn = div.querySelector(".move-down");
    const fileUploadInput = div.querySelector('input[type="file"]');

    musicUploadBtn.addEventListener("click", () => {
      fileUploadInput.click();
    });
    moveUpBtn.addEventListener("click", (event) =>
      moveItem(event, MOVE_TYPE.up)
    );
    moveDownBtn.addEventListener("click", (event) =>
      moveItem(event, MOVE_TYPE.down)
    );
    fileUploadInput.addEventListener("change", (event) =>
      uploadMusicFile(event)
    );
  }

  /**
   * Playlist에 drag 이벤트 리스너를 추가하는 함수
   */
  static addListeners() {
    Playlist.playlist.addEventListener("dragstart", itemDragStart);
    Playlist.playlist.addEventListener("dragover", itemDragOver);
    Playlist.playlist.addEventListener("dragend", itemDragEnd);
  }
}
