import React, { useState, useEffect, useRef, useCallback } from "react";

import { useParams, useSearchParams, Navigate } from "react-router-dom";
import axios from "axios";
import { v1 } from "uuid";

import {
  videoHistoryLocal,
  favoritesLocal,
  settings,
  playlistLocal,
  playlistsLocal,
} from "./localStorageData";

import Main from "./components/Main";
import Sidebar from "./components/Sidebar";
import Playlist from "./components/Playlist";

function App(props) {
  const { notFound = false } = props;

  const { dirParam = "", fileParam = "" } = useParams();

  const [path, setPath] = useState(settings.startDir);

  const [fileSelected, setFileSelected] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [loadingSubtitles, setLoadingSubtitles] = useState(false);

  const [playlists, setPlaylists] = useState(playlistsLocal);
  const [playlist, setPlaylist] = useState({});
  const [activePlaylist, setActivePlaylist] = useState(playlistLocal);

  const [dirs, setDirs] = useState([]);
  const [files, setFiles] = useState([]);

  const [filterName, setFilterName] = useState("");

  const [favorites, setFavorites] = useState(favoritesLocal);
  const [videoHistory, setVideoHistory] = useState(videoHistoryLocal);

  const [smShowSidebar, setSmShowSidebar] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // settings
  const [startDir, setStartDir] = useState(settings.startDir);
  const [autoPlay, setAutoPlay] = useState(settings.autoPlay);
  const [autoNext, setAutoNext] = useState(settings.autoNext);

  const [colorMode, setColorMode] = useState(settings.colorMode); // light/dark/auto
  // dark mode
  const darkMode =
    colorMode === "dark"
      ? true
      : colorMode === "light"
      ? false
      : window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

  const cancelTokenSource = useRef();
  const openDir = useCallback((dirPath) => {
    console.log("callback openDir");
    // cancel prev request
    if (cancelTokenSource.current) cancelTokenSource.current.cancel();
    cancelTokenSource.current = axios.CancelToken.source();

    axios
      .get("/dir/" + encodeURIComponent(JSON.stringify(dirPath)), {
        cancelToken: cancelTokenSource.current.token,
      })
      .then(({ data }) => {
        setPath(dirPath);
        setDirs(data.dirs);
        setFiles(
          data.files.map((file) => {
            const videoSrc = `/video/${encodeURIComponent(
              JSON.stringify([...dirPath, file])
            )}`;
            return {
              name: file,
              path: dirPath,
              videoSrc,
              subtitles: videoSrc + "/subtitles",
              imgSrc: videoSrc + "/thumbnail",
            };
          })
        );
      })
      .catch((err) => {
        <Navigate to="/" />;
      });
  }, []);

  const saveSettings = useCallback(
    ({ startingDir, color, enableAutoPlay, enableAutoNext }) => {
      console.log("callback saveSettings", {
        startingDir,
        color,
        enableAutoPlay,
        enableAutoNext,
      });
      try {
        //const settings = JSON.parse(localStorage.getItem("settings"));
        const settings = {
          startDir: startingDir ? startingDir : startDir,
          colorMode: color ? color : colorMode,
          autoNext: enableAutoNext !== undefined ? enableAutoNext : autoNext,
          autoPlay: enableAutoPlay !== undefined ? enableAutoPlay : autoPlay,
        };
        console.log("saving", settings);
        localStorage.setItem("settings", JSON.stringify(settings));
      } catch (error) {
        localStorage.removeItem("settings");
      }
    },
    [startDir, colorMode, autoPlay, autoNext]
  );

  const updateSettings = ({
    startingDir,
    color,
    enableAutoPlay,
    enableAutoNext,
  }) => {
    console.log("updatSettings");
    if (startingDir) setStartDir(startingDir);
    if (color) setColorMode(color);
    if (enableAutoNext !== undefined) setAutoNext(enableAutoNext);
    if (enableAutoPlay !== undefined) setAutoPlay(enableAutoPlay);
    saveSettings({ startingDir, color, enableAutoPlay, enableAutoNext });
  };

  const createPlaylist = ({ name, playlist }) => {
    console.log("new playlist", { name, playlist });
    if (playlist) return setPlaylists((prev) => [...prev, playlist]);
    if (name)
      setPlaylists((prev) => [
        ...prev,
        { id: v1(), name, files: [], isDirectory: false },
      ]);
  };

  useEffect(() => {
    console.log("useEffect [dirParam, startDir, openDir]", {
      dirParam,
      startDir,
    });
    try {
      if (dirParam === "") return openDir(startDir);
      const dirPath = dirParam !== "" ? JSON.parse(dirParam) : "";
      openDir(dirPath);
    } catch (error) {
      <Navigate to="/" />;
    }
  }, [dirParam, startDir, openDir]);

  useEffect(() => {
    console.log("useEffect [fileparam]");
    try {
      const videoSrc =
        fileParam !== "" ? `/video/${encodeURIComponent(fileParam)}` : "";
      const file =
        fileParam !== ""
          ? {
              name: JSON.parse(fileParam)[JSON.parse(fileParam).length - 1],
              path: JSON.parse(fileParam).splice(
                0,
                JSON.parse(fileParam).length - 1
              ),
              videoSrc,
              subtitles: videoSrc + "/subtitles",
              imgSrc: videoSrc + "/thumbnail",
            }
          : "";
      // set file
      if (fileParam !== "") setFileSelected(file);
      else setFileSelected(null);
    } catch (error) {
      <Navigate to="/" />;
    }
  }, [fileParam]);

  useEffect(() => {
    console.log("useEffect [fileSelected]");
    // load subtitles
    if (fileSelected !== null) {
      setLoadingSubtitles(true);
      axios
        .get(fileSelected.subtitles)
        .then(({ data }) => setSubtitles(data))
        .catch((err) => console.log(err))
        .finally(() => setLoadingSubtitles(false));
    } else setSubtitles([]);
  }, [fileSelected]);

  // set playlist
  const [search, setSearch] = useSearchParams();
  const pl = search.get("pl");
  useEffect(() => {
    if (pl === undefined || !fileSelected) return;
    console.log("useEffect [pl, files] *", { pl, fileSelected, files });
    if (pl === "new") {
      // set directory as playlist
      const playlistData = {
        id: v1(),
        name: path.join("/"),
        files,
        isDirectory: true,
      };
      setActivePlaylist(playlistData);
      localStorage.setItem("playlist", JSON.stringify(playlistData));
      setSearch({ pl: "" });
    } else if (pl !== "" && pl !== null) {
      // set playlist
      const playlistData = playlists.find(
        (playlist) =>
          playlist.id === pl &&
          (!fileSelected ||
            playlist.files.findIndex(
              (file) => fileSelected.name === file.name
            ) !== -1)
      );
      console.log("huuhuh0", pl, playlistData);
      setActivePlaylist(playlistData);
      localStorage.setItem("playlist", JSON.stringify(playlistData));
      //setSearch({ pl: "" });
    }
  }, [pl, fileSelected, files, path, playlists, setSearch]);

  useEffect(() => {
    console.log("useEffect [videoHistory]");
    window.localStorage.setItem("videoHistory", JSON.stringify(videoHistory));
  }, [videoHistory]);

  useEffect(() => {
    console.log("useEffect [favorites]");
    window.localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("playlists", JSON.stringify(playlists));
  }, [playlists]);

  // children props
  const sidebarProps = {
    videoHistory: videoHistory.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    ),
    dirs,
    path,
    startDir,
    favorites,
    setSmShowSidebar,
  };
  const mainProps = {
    files:
      filterName === ""
        ? files
        : files.filter(
            (file) =>
              file.name.toLowerCase().indexOf(filterName.toLowerCase()) !== -1
          ),
    fav:
      favorites.map((f) => JSON.stringify(f)).indexOf(JSON.stringify(path)) !==
      -1,
    fileSelected,
    activePlaylist,
    filterName,
    subtitles,
    autoNext,
    autoPlay,
    startDir,
    colorMode,
    dirs,
    path,
    loadingSubtitles,
    videoHistory,
    playlist,
    playlists,
    setFavorites,
    setVideoHistory,
    setFileSelected,
    setFilterName,
    setShowPlaylist,
    setPlaylist,
    setPlaylists,
    updateSettings,
  };
  const playlistProps = {
    activePlaylist,
    playlists,
    fileSelected,
    createPlaylist,
    setShowPlaylist,
    setPlaylist,
  };

  return (
    <div className={`h-screen overflow-auto md:flex ${darkMode && "dark"}`}>
      <Sidebar
        className={`${
          !smShowSidebar && "hidden"
        } fixed w-10/12 overflow-auto border-r-2 z-20 
        dark:bg-slate-900 dark:text-slate-400 
        md:static md:block md:flex-shrink-0 md:w-96 h-full p-5`}
        {...sidebarProps}
      />

      {notFound ? (
        <NotFound />
      ) : (
        <Main
          className={`w-full h-full overflow-hidden flex flex-col bg-white 
            dark:bg-slate-900 dark:text-slate-400`}
          {...mainProps}
        />
      )}

      <Playlist
        className={`${
          !showPlaylist && "hidden"
        } fixed left-0 top-0 z-40 h-full w-full
         dark:text-slate-400`}
        {...playlistProps}
      />

      {!smShowSidebar && <MenuButton setSmShowSidebar={setSmShowSidebar} />}
      {!showPlaylist && <PlaylistButton setShowPlaylist={setShowPlaylist} />}
    </div>
  );
}

const NotFound = () => (
  <div className="flex w-full justify-center items-center text-4xl">
    404 page not found
  </div>
);

const MenuButton = ({ setSmShowSidebar }) => (
  <div className="fixed bottom-4 right-4 md:hidden">
    <button
      className="px-4 py-2 bg-blue-100 opacity-80 border border-blue-200 font-extrabold md:hidden"
      onClick={() => setSmShowSidebar(true)}
    >
      {" "}
      &#9776;{" "}
    </button>
  </div>
);

const PlaylistButton = ({ setShowPlaylist }) => (
  <div className="fixed bottom-16 right-4 md:bottom-4">
    <button
      className="px-4 py-2 bg-blue-100 opacity-80 border border-blue-200 font-extrabold"
      onClick={() => setShowPlaylist(true)}
    >
      📃
    </button>
  </div>
);

export default App;
