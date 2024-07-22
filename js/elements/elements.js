import Project from "../project";
import Playlist from "./playlist";
import AudioCanvas from "./audioCanvas";
import PlayButton from "./playButton";
import MoveButton from "./moveButton";
import RangeSlider from "./rangeSlider";

export default function initElement() {
  Project.info.forEach((info, idx) => {
    Playlist.createDiv(info, idx);
  });
  Playlist.addListeners();
  AudioCanvas.initHeight();
  AudioCanvas.addListener();
  PlayButton.addListener();
  MoveButton.addListener();
  RangeSlider.addListener();
}
