import Loading from "./loading";
import Playlist from "./playlist";
import AudioCanvas from "./audioCanvas";
import PlayButton from "./playButton";
import MoveButton from "./moveButton";
import RangeSlider from "./rangeSlider";
import ExportFile from "./exportFile";
import BatchUpload from "./batchUpload";

export default function initElement() {
  Loading.addListener();
  Playlist.addListeners();
  AudioCanvas.initHeight();
  AudioCanvas.addListener();
  PlayButton.addListener();
  MoveButton.addListener();
  RangeSlider.addListener();
  ExportFile.addListener();
  BatchUpload.addListener();
}
