import { DEFAULT_AUDIO_INFO } from "./config";
import initElement from "./elements/elements";
import Project from "./project";

const res = await fetch("../playlist-info.json");
const playlistInfo = await res.json();

initElement();
