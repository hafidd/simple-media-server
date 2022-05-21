import { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import { toUrlParams } from "../helpers";

import VideoPlayer from "./VideoPlayer";

import noimg from "../noimg.png";

const Main = (props) => {
  const {
    className = "",
    dirs,
    path,
    files,
    filterName,
    fileSelected,
    playlist,
    playlists,
    activePlaylist,
    subtitles,
    videoHistory,
    fav,
    setFavorites,
    loadingSubtitles,

    startDir,
    colorMode,
    autoPlay,
    autoNext,

    setFilterName,
    updateSettings,
    setVideoHistory,
    setShowPlaylist,
    setPlaylists,
  } = props;

  const nextFile =
    fileSelected &&
    activePlaylist &&
    activePlaylist.files &&
    activePlaylist.files.length > 1 &&
    activePlaylist.files[
      activePlaylist.files.findIndex(
        (file) => file.name === fileSelected.name
      ) + 1
    ];

  const prevFile =
    fileSelected &&
    activePlaylist &&
    activePlaylist.files &&
    activePlaylist.files.length > 1 &&
    activePlaylist.files[
      activePlaylist.files.findIndex(
        (file) => file.name === fileSelected.name
      ) - 1
    ];

  const home = JSON.stringify(path) === JSON.stringify(startDir);

  return (
    <div className={className}>
      <VideoContainer
        {...{
          fileSelected,
          subtitles,
          videoHistory,
          setVideoHistory,
          loadingSubtitles,
          nextFile,
          prevFile,
          autoNext,
          autoPlay,
          updateSettings,
        }}
      />
      <Filter filterName={filterName} setFilterName={setFilterName} />
      <Menus
        {...{
          path,
          fileSelected,
          home,
          updateSettings,
          fav,
          setFavorites,
          colorMode,
        }}
      />
      <DirectoriesSm {...{ fileSelected, dirs, path }} />
      <Files
        {...{
          path,
          files,
          activePlaylist,
          playlist,
          playlists,
          setPlaylists,
          setShowPlaylist,
        }}
      />
    </div>
  );
};

const VideoContainer = (props) => {
  const {
    fileSelected,
    subtitles,
    videoHistory,
    setVideoHistory,
    loadingSubtitles,
    nextFile,
    prevFile,
    autoPlay,
    autoNext,
    updateSettings,
  } = props;

  return (
    fileSelected !== null && (
      <div id="top">
        <VideoPlayer
          file={fileSelected}
          nextFile={nextFile}
          autoPlay={autoPlay}
          autoNext={autoNext}
          subtitles={subtitles}
          videoHistory={videoHistory}
          setVideoHistory={setVideoHistory}
        />
        <div id="desc" className="w-full">
          {loadingSubtitles && (
            <p className="text-center">Loading subtitles ...</p>
          )}
          <h3 className="font-bold text-center overflow-hidden">
            {fileSelected.name}
          </h3>
          <div className="flex items-center justify-center w-full text-2xl mb-1">
            {prevFile && (
              <Link
                className="text-base font-bold px-1 border rounded-md mr-1"
                to={toUrlParams([
                  prevFile.path,
                  [...prevFile.path, prevFile.name],
                ])}
              >
                ⏮
              </Link>
            )}
            {nextFile && (
              <Link
                className="text-base font-bold px-1 border rounded-md mr-1"
                to={toUrlParams([
                  nextFile.path,
                  [...nextFile.path, nextFile.name],
                ])}
              >
                ⏭
              </Link>
            )}
            <Link
              className="text-base font-bold px-1 border rounded-md mr-1"
              to="#"
              onClick={() => updateSettings({ enableAutoPlay: !autoPlay })}
            >
              autoplay {autoPlay ? "on" : "off"}
            </Link>
            <Link
              className="text-base font-bold px-1 border rounded-md mr-1"
              to="#"
              onClick={() => updateSettings({ enableAutoNext: !autoNext })}
            >
              autonext {autoNext ? "on" : "off"}
            </Link>
          </div>
        </div>
      </div>
    )
  );
};

const Filter = ({ filterName, setFilterName }) => (
  <div className="border-y flex">
    {filterName && <div className="p-2 font-bold">Filter : </div>}
    <input
      type="search"
      id="filter"
      className="flex-1 p-2 focus:outline-none bg-inherit"
      placeholder="filter..."
      defaultValue={filterName}
      onChange={(e) => setFilterName(e.target.value)}
    />
  </div>
);

const Menus = (props) => {
  const {
    path,
    fileSelected,
    home,
    updateSettings,
    fav,
    setFavorites,
    colorMode,
  } = props;

  return (
    <div className="p-2 w-full">
      {path.length > 0 && (
        <Link
          className={`ml-1 font-bold px-2 py-1 border`}
          to={toUrlParams([
            [...path].splice(0, path.length - 1),
            fileSelected !== null
              ? [...fileSelected.path, fileSelected.name]
              : "",
          ])}
        >
          ..
        </Link>
      )}
      {!home && (
        <Link className="ml-1 font-bold px-2 py-1 border" to="/">
          go 🏠
        </Link>
      )}
      <div className="float-right">
        {!home && (
          <button
            className="font-bold border px-2 py-1"
            onClick={() => {
              let pathString = "";
              path.forEach((p) => (pathString += p + "/"));
              if (
                window.confirm(
                  "Set (" + pathString + ") as starting directory?"
                )
              )
                updateSettings({ startingDir: path });
            }}
          >
            set 🏠
          </button>
        )}
        <button
          className="ml-1 font-bold border px-2 py-1"
          onClick={() => {
            setFavorites((prevFav) =>
              fav
                ? prevFav.filter(
                    (v) => JSON.stringify(path) !== JSON.stringify(v)
                  )
                : [...prevFav, path]
            );
          }}
        >
          <span className={`opacity-${fav ? "100" : "20"}`}>⭐</span>
        </button>
        <button
          className="ml-1 font-bold border px-2 py-1"
          onClick={() =>
            updateSettings({
              color:
                colorMode === "dark"
                  ? "light"
                  : colorMode === "light"
                  ? "auto"
                  : "dark",
            })
          }
        >
          <span>
            {colorMode === "dark" ? "🌜" : colorMode === "light" ? "☀" : "A"}
          </span>
        </button>
      </div>
    </div>
  );
};

const DirectoriesSm = (props) => {
  const { fileSelected, dirs, path } = props;
  return (
    <div id="dir-main" className="md:hidden">
      <div
        className={`flex mb-1 ${
          fileSelected === null
            ? "flex-wrap max-h-40 overflow-y-auto px-2"
            : "overflow-x-auto"
        }`}
      >
        {dirs.map((dir, i) => (
          <Link
            key={dir + i + "dir-main"}
            className={`mr-1 ${
              fileSelected !== null
                ? "whitespace-nowrap"
                : "mb-1 break-all text-center"
            } px-2 py-1 bg-slate-100`}
            to={toUrlParams([
              [...path, dir],
              fileSelected !== null
                ? [...fileSelected.path, fileSelected.name]
                : "",
            ])}
          >
            {dir}
          </Link>
        ))}
      </div>
    </div>
  );
};

const Files = ({
  path = [],
  files = [],
  playlist = {},
  playlists,
  setPlaylists,
  setShowPlaylist,
}) => {
  const [tab, setTab] = useState("files");

  useEffect(() => {
    setTab("files");
  }, [path]);

  useEffect(() => {
    if (playlist.id) {
      setTab("playlist");
      setShowPlaylist(false);
    }
  }, [playlist, setShowPlaylist]);

  return (
    <>
      <div className="px-3 pb-1 mb-1">
        <Link
          to="#"
          className={`${
            playlist.id && tab === "files" && "font-bold border-b-2 py-1"
          } mr-4`}
          onClick={() => setTab("files")}
        >
          {path.join("/")}
        </Link>
        {playlist.id && (
          <Link
            to="#"
            className={`${
              playlist.id && tab !== "files" && "font-bold border-b-2 py-1"
            }`}
            onClick={() => setTab("playlist")}
          >
            Playlist : {playlist.name}
          </Link>
        )}
      </div>
      <div
        id="content-main"
        className="p-2 min-h-[12rem] overflow-y-auto md:flex md:flex-wrap"
      >
        {tab === "files"
          ? files.map((file, i) => (
              <Link
                className="w-full mb-2 lg:w-1/2 xl:w-1/3 xxl:w-1/4"
                key={i + file + "a"}
                to={toUrlParams([
                  file.path,
                  [...file.path, file.name],
                  "?pl=new",
                ])}
              >
                <File
                  file={file}
                  playlists={playlists}
                  setPlaylists={setPlaylists}
                />
              </Link>
            ))
          : playlist &&
            playlist.files.map((file, i) => (
              <Link
                className="w-full mb-2 lg:w-1/2 xl:w-1/3 xxl:w-1/4"
                key={i + file + "a"}
                to={toUrlParams([
                  file.path,
                  [...file.path, file.name],
                  `?pl=${playlist.id}`,
                ])}
              >
                <File
                  file={file}
                  playlists={playlists}
                  setPlaylists={setPlaylists}
                  playlist={playlist}
                />
              </Link>
            ))}
        {/* <AddToPlayList playlists={playlists} addToPlaylist={null} /> */}
      </div>
    </>
  );
};

const File = ({ file, playlists, setPlaylists, playlist }) => {
  const [x, setX] = useState(false);

  return (
    <div className="p-1 flex relative">
      <img
        src={file.imgSrc}
        alt="img"
        className="h-[92px] w-[140px] bg-slate-400 flex-shrink-0"
        loading="lazy"
        onError={(e) => {
          e.target.src = noimg;
        }}
      />

      {playlists && !playlist && playlists.length > 0 && (
        <button
          className="absolute left-0 bottom-0 bg-slate-50 border rounded-md p-1 z-10 hover:bg-slate-300"
          onClick={(e) => {
            e.preventDefault();
            setX(true);
          }}
        >
          ➕
        </button>
      )}

      <div className="px-1 h-[92px] overflow-hidden">
        <p className="break-all">Playlist : {file.name}</p>
      </div>
      {x && (
        <AddToPlayList
          playlists={playlists}
          setX={setX}
          setPlaylists={setPlaylists}
          file={file}
        />
      )}
    </div>
  );
};

const AddToPlayList = ({ playlists, setX, setPlaylists, file }) => {
  return (
    <div
      className="fixed flex justify-center items-center top-0 left-0 z-40 h-full w-full"
      onClick={(e) => {
        e.preventDefault();
        setX(false);
      }}
    >
      <div className="w-11/12 z-50 h-fit p-2 bg-white dark:bg-slate-700 md:w-[400px]">
        <p className="mb-2 text-xl font-bold">Add to playlist</p>
        <ul>
          {playlists.map((playlist) => (
            <li
              key={playlist.id}
              className="w-100 border p-1 px-2 mb-1 break-all text-lg font-bold hover:bg-slate-300"
              onClick={() => {
                setPlaylists((prev) =>
                  prev.map((pl) =>
                    pl.name !== playlist.name
                      ? pl
                      : { ...pl, files: [...pl.files, file] }
                  )
                );
              }}
            >
              {playlist.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Main;
