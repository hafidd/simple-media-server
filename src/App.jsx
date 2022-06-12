import React, { useState, useEffect, useRef, useCallback } from "react";

import { useParams, useSearchParams, Navigate, Link } from "react-router-dom";
import axios from "axios";
import { v1, v4 } from "uuid";

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
  // const [queue, setQueue] = useState([]);

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
  const [shuffle, setShuffle] = useState(settings.shuffle);

  // sleep
  const [sleep, setSleep] = useState(false);
  const [sleepTimer, setSleepTimer] = useState(0);
  let sleepIv = useRef();

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
    //console.log("callback openDir", dirPath);
    // cancel prev request
    if (cancelTokenSource.current) cancelTokenSource.current.cancel();
    cancelTokenSource.current = axios.CancelToken.source();

    axios
      .get("/dir/" + encodeURIComponent(JSON.stringify(dirPath)), {
        cancelToken: cancelTokenSource.current.token,
      })
      .then(({ data }) => {
        //console.log(data);
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
        //console.log(err);
        return <Navigate to="/" />;
      });
  }, []);

  const saveSettings = useCallback(
    ({ startingDir, color, enableAutoPlay, enableAutoNext, enableShuffle }) => {
      // console.log("callback saveSettings", {
      //   startingDir,
      //   color,
      //   enableAutoPlay,
      //   enableAutoNext,
      //   enableShuffle,
      // });
      try {
        //const settings = JSON.parse(localStorage.getItem("settings"));
        const settings = {
          startDir: startingDir ? startingDir : startDir,
          colorMode: color ? color : colorMode,
          autoNext: enableAutoNext !== undefined ? enableAutoNext : autoNext,
          autoPlay: enableAutoPlay !== undefined ? enableAutoPlay : autoPlay,
          shuffle: enableShuffle !== undefined ? enableShuffle : shuffle,
        };
        console.log("saving", settings);
        localStorage.setItem("settings", JSON.stringify(settings));
      } catch (error) {
        localStorage.removeItem("settings");
      }
    },
    [startDir, colorMode, autoPlay, autoNext, shuffle]
  );

  const updateSettings = ({
    startingDir,
    color,
    enableAutoPlay,
    enableAutoNext,
    enableShuffle,
  }) => {
    console.log("updatSettings");
    if (startingDir) setStartDir(startingDir);
    if (color) setColorMode(color);
    if (enableAutoNext !== undefined) setAutoNext(enableAutoNext);
    if (enableAutoPlay !== undefined) setAutoPlay(enableAutoPlay);
    if (enableShuffle !== undefined) setShuffle(enableShuffle);
    saveSettings({
      startingDir,
      color,
      enableAutoPlay,
      enableAutoNext,
      enableShuffle,
    });
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

  const startSleep = (time = 10) => {
    setSleepTimer(time);
    if (sleepIv.current) clearInterval(sleepIv.current);
    sleepIv.current = setInterval(() => {
      setSleepTimer((prev) => {
        if (prev === 0) {
          setSleep(true);
          clearInterval(sleepIv.current);
          return prev;
        }
        return prev - 1;
      });
    }, 1000);
  };
  const cancelSleep = () => {
    clearInterval(sleepIv.current);
    setSleep(false);
    setSleepTimer(0);
  };

  useEffect(() => {
    // console.log("useEffect [dirParam, startDir, openDir]", {
    //   dirParam,
    //   startDir,
    // });
    try {
      if (dirParam === "") return openDir(startDir);
      const dirPath = dirParam !== "" ? JSON.parse(dirParam) : "";
      openDir(dirPath);
    } catch (error) {
      <Navigate to="/" />;
    }
  }, [dirParam, startDir, openDir]);

  useEffect(() => {
    //console.log("useEffect [fileparam]", fileParam);
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
      else {
        setFileSelected(null);
        setActivePlaylist(null);
      }
    } catch (error) {
      <Navigate to="/" />;
    }
  }, [fileParam]);

  useEffect(() => {
    //console.log("useEffect [fileSelected]");
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
    //console.log("useEffect [pl, files] *", { pl, fileSelected, files });
    if (pl === "new") {
      // set directory as playlist
      let fileId = "";
      const playlistData = {
        id: v1(),
        name: path.join("/"),
        files: files.map((file) => {
          const fileData = { ...file, id: v4() };
          if (fileSelected.name === file.name) {
            console.log(`playing ` + file.name);
            fileId = fileData.id;
          }
          return fileData;
        }),
        isDirectory: true,
      };
      setActivePlaylist({
        ...playlistData,
        playlist: !shuffle
          ? playlistData.files
          : [...playlistData.files].sort(() => Math.random() - 0.5),
      });
      localStorage.setItem("playlist", JSON.stringify(playlistData));
      setSearch({ pl: "", fileId });
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
      if (playlistData)
        setActivePlaylist({
          ...playlistData,
          playlist: !shuffle
            ? playlistData.files
            : [...playlistData.files].sort(() => Math.random() - 0.5),
        });

      localStorage.setItem("playlist", JSON.stringify(playlistData));
      // setSearch({ fileId });
    }
    // eslint-disable-next-line
  }, [
    fileSelected,
    files,
    path,
    playlists,
    //pl,
    //setSearch
  ]);

  useEffect(() => {
    window.localStorage.setItem("videoHistory", JSON.stringify(videoHistory));
  }, [videoHistory]);

  useEffect(() => {
    window.localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    setPlaylist((prev) => playlists.find((pl) => pl.id === prev.id) || {});

    localStorage.setItem("playlists", JSON.stringify(playlists));
  }, [playlists]);

  // shuffle playlist
  useEffect(
    () =>
      setActivePlaylist((prev) =>
        shuffle && prev
          ? {
              ...prev,
              playlist: [...prev.files].sort(() => Math.random() - 0.5),
            }
          : prev
          ? { ...prev, playlist: prev.files }
          : null
      ),
    [shuffle]
  );

  // children props
  const sidebarProps = {
    videoHistory: videoHistory.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    ),
    dirs,
    path,
    startDir,
    favorites,
    setFavorites,
    setVideoHistory,
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
    shuffle,
    startDir,
    colorMode,
    dirs,
    path,
    loadingSubtitles,
    videoHistory,
    playlist,
    playlists,
    sleep,
    sleepTimer,
    setFavorites,
    setVideoHistory,
    setFileSelected,
    setFilterName,
    setShowPlaylist,
    setPlaylist,
    setPlaylists,
    setActivePlaylist,
    updateSettings,
    startSleep,
    cancelSleep,
  };
  const playlistProps = {
    activePlaylist,
    playlists,
    fileSelected,
    createPlaylist,
    setShowPlaylist,
    setPlaylist,
    setPlaylists,
  };

  return (
    <div className={`h-screen overflow-auto md:flex ${darkMode && "dark"}`}>
      {sleep && sleepTimer === 0 && (
        <Link
          to="#"
          className="fixed flex justify-center items-center z-50 w-full h-full bg-black bg-opacity-95"
          onClick={(e) => {
            e.preventDefault();
            cancelSleep();
          }}
        >
          <p className="text-8xl text-slate-700">
            Turu zz<span className="text-7xl">zz</span>
            <span className="text-6xl">zz</span>
            <span className="text-5xl">...</span>
          </p>
        </Link>
      )}

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
      💽
    </button>
  </div>
);

const LinkWithQuery = ({ children, to, queries, ...props }) => {
  const [searchParams] = useSearchParams();
  let search = queries ? "" : "?";
  searchParams.forEach((v, k) => {
    if (!queries || (queries && queries.indexOf(k) !== -1))
      search += `&${k}=${v}`;
  });
  return (
    <Link to={to + search} {...props}>
      {children}
    </Link>
  );
};

export { LinkWithQuery };
export default App;
