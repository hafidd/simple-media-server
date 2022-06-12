import { useEffect, useRef, useState } from "react";

import { useSearchParams, Link, useLocation } from "react-router-dom";
import { v4 } from "uuid";
import axios from "axios";

import { LinkWithQuery } from "../App";

import { getTimer, toUrlParams } from "../helpers";

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
    shuffle,

    sleep,
    sleepTimer,

    setFilterName,
    updateSettings,
    setVideoHistory,
    setShowPlaylist,
    setPlaylists,
    setActivePlaylist,
    startSleep,
    cancelSleep,
  } = props;

  const [search] = useSearchParams();
  const fileId = search.get("fileId");

  const cancelTokenSources = useRef();
  const [loadingPlaylist, setLoadingPlaylist] = useState([]);
  const addToLoadingPlaylist = (playlist) => {
    const newData = { id: v4(), cancelTokenSource: axios.CancelToken.source() };
    console.log(cancelTokenSources, newData);
    cancelTokenSources.current = [
      ...(Array.isArray(cancelTokenSources.current)
        ? cancelTokenSources.current
        : []),
      newData,
    ];

    setLoadingPlaylist((prev) => [
      ...prev,
      {
        id: newData.id,
        dirName: path.join("/"),
        playlistName: playlist.name,
        playlistId: playlist.id,
      },
    ]);

    axios
      .get(
        "/files/" + encodeURIComponent(JSON.stringify(path)) + "/" + newData.id,
        {
          cancelToken: newData.cancelTokenSource.token,
        }
      )
      .then(({ data }) => {
        //console.log(data);

        setPlaylists((prev) =>
          prev.map((pl) =>
            pl.id !== playlist.id
              ? pl
              : {
                  ...pl,
                  files: [
                    ...pl.files,
                    ...data.map((fileData) => {
                      const videoSrc = `/video/${encodeURIComponent(
                        JSON.stringify([...fileData.dirPath, fileData.file])
                      )}`;
                      return {
                        id: v4(),
                        name: fileData.file,
                        path: fileData.dirPath,
                        videoSrc,
                        subtitles: videoSrc + "/subtitles",
                        imgSrc: videoSrc + "/thumbnail",
                      };
                    }),
                  ],
                }
          )
        );

        alert(`${data.length} added to playlist [${playlist.name}]`);
        cancelAddToPlaylist(newData.id, false);
      })
      .catch((err) => {
        console.log(err);
        cancelAddToPlaylist(newData.id);
      });
  };
  const cancelAddToPlaylist = (processId, cancelRequest) => {
    if (cancelRequest) {
    }
    axios
      .get("/cancel/" + processId)
      .then(() => {
        setLoadingPlaylist((prev) => prev.filter(({ id }) => id !== processId));
      })
      .catch((err) => console.log(err));
  };

  const nextFile =
    fileSelected &&
    activePlaylist &&
    activePlaylist.playlist &&
    activePlaylist.playlist.length > 1 &&
    (activePlaylist.playlist[
      activePlaylist.playlist.findIndex((file) => file.id === fileId) + 1
    ]
      ? activePlaylist.playlist[
          activePlaylist.playlist.findIndex((file) => file.id === fileId) + 1
        ]
      : activePlaylist.playlist[0]);

  const prevFile =
    fileSelected &&
    activePlaylist &&
    activePlaylist.playlist &&
    activePlaylist.playlist.length > 1 &&
    (activePlaylist.playlist[
      activePlaylist.playlist.findIndex((file) => file.id === fileId) - 1
    ]
      ? activePlaylist.playlist[
          activePlaylist.playlist.findIndex((file) => file.id === fileId) - 1
        ]
      : activePlaylist.playlist[activePlaylist.playlist.length - 1]);

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
          shuffle,
          sleep,
          updateSettings,
        }}
      />
      <Filter filterName={filterName} setFilterName={setFilterName} />
      <Menus
        {...{
          path,
          files,
          fileSelected,
          home,
          sleep,
          sleepTimer,
          updateSettings,
          fav,
          setFavorites,
          playlists,
          colorMode,
          startSleep,
          cancelSleep,
          setPlaylists,
          addToLoadingPlaylist,
        }}
      />
      <DirectoriesSm {...{ fileSelected, dirs, path }} />
      <Files
        {...{
          path,
          files,
          fileSelected,
          activePlaylist,
          playlist,
          playlists,
          setPlaylists,
          setShowPlaylist,
          setActivePlaylist,
          loadingPlaylist,
          cancelAddToPlaylist,
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
    shuffle,
    updateSettings,
    sleep,
  } = props;

  return (
    fileSelected !== null && (
      <div className="flex flex-col items-center">
        <VideoPlayer
          sleep={sleep}
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
          <p className="w-full font-bold text-center whitespace-nowrap">
            {fileSelected.name}
          </p>
          <div className="flex items-center justify-center w-full text-2xl mb-1">
            {prevFile && (
              <Link
                className="text-base font-bold px-1 border rounded-md mr-1"
                to={toUrlParams([
                  prevFile.path,
                  [...prevFile.path, prevFile.name],
                  `?time=0&fileId=${prevFile.id}`,
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
                  `?time=0&fileId=${nextFile.id}`,
                ])}
              >
                ⏭
              </Link>
            )}
            {/* <Link
              className="text-base font-bold px-1 border rounded-md mr-1"
              to={`#`}
              onClick={(e) => {
                e.preventDefault();
                updateSettings({ enableAutoPlay: !autoPlay });
              }}
            >
              autoplay {autoPlay ? "on" : "off"}
            </Link> */}
            <Link
              className="text-base font-bold px-1 border rounded-md mr-1"
              to={`#`}
              onClick={(e) => {
                e.preventDefault();
                updateSettings({ enableShuffle: !shuffle });
              }}
            >
              🔀 {shuffle ? <span className="text-green-500">on</span> : "off"}
            </Link>
            <Link
              className="text-base font-bold px-1 border rounded-md mr-1"
              to={`#`}
              onClick={(e) => {
                e.preventDefault();
                updateSettings({ enableAutoNext: !autoNext });
              }}
            >
              autonext{" "}
              {autoNext ? <span className="text-green-500">on</span> : "off"}
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
    sleepTimer,
    path,
    playlists,
    files,
    fileSelected,
    setPlaylists,
    home,
    updateSettings,
    fav,
    setFavorites,
    colorMode,
    startSleep,
    cancelSleep,
    addToLoadingPlaylist,
  } = props;

  // add folder to playlist
  const [menu, setMenu] = useState(false);
  const [includeSubs, setIncludeSubs] = useState(false);
  //const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  //const [excludeDir, setExcludeDir] = useState("");
  //const [excludeDirs, setExcludeDirs] = useState([]);
  useEffect(() => {
    if (!menu && includeSubs) setIncludeSubs(false);
  }, [menu]);

  return (
    <div className="p-2 w-full">
      {path.length > 0 && (
        <LinkWithQuery
          className={`ml-1 font-bold px-2 py-1 border`}
          to={toUrlParams([
            [...path].splice(0, path.length - 1),
            fileSelected !== null
              ? [...fileSelected.path, fileSelected.name]
              : "",
          ])}
        >
          ..
        </LinkWithQuery>
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
          onClick={() => setMenu(true)}
        >
          <span className={`opacity-${fav ? "100" : "20"}`}>+</span>
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

        <button
          className="ml-1 font-bold border px-2 py-1"
          onClick={() => {
            if (sleepTimer > 0) {
              if (window.confirm("cancel sleep?")) return cancelSleep();
              return;
            }
            const time = window.prompt("enter sleep time (minutes)");
            startSleep(!isNaN(time) ? Math.trunc(time) * 60 : 30 * 60);
          }}
        >
          ⏲ {sleepTimer > 0 && getTimer(sleepTimer)}
        </button>
      </div>

      {menu && (
        <div
          className="fixed flex items-center justify-center left-0 top-0 w-full h-full z-40"
          onClick={() => setMenu(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-11/12 z-50 h-fit p-2 bg-slate-200 dark:bg-slate-700 md:w-[400px]"
          >
            <p className="mb-2 font-bold">Add {path.join("/")} to playlist</p>
            <div className="mb-2">
              <input
                type="checkbox"
                checked={includeSubs}
                onChange={() => setIncludeSubs((prev) => !prev)}
              />{" "}
              include sub directories
            </div>
            select playlist :{" "}
            <ul>
              {playlists.map((playlist) => (
                <li
                  key={playlist.id}
                  className="w-100 border px-1 mb-1 break-all font-bold hover:bg-slate-300 hover:text-black cursor-pointer"
                  onClick={() => {
                    setMenu(false);

                    if (!includeSubs)
                      return setPlaylists((prev) =>
                        prev.map((pl) =>
                          pl.id !== playlist.id
                            ? pl
                            : {
                                ...pl,
                                files: [
                                  ...pl.files,
                                  ...files.map((file) => ({
                                    ...file,
                                    id: v4(),
                                  })),
                                ],
                              }
                        )
                      );
                    addToLoadingPlaylist(playlist);
                  }}
                >
                  {playlist.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
  fileSelected,
  playlist = {},
  playlists,
  setPlaylists,
  setActivePlaylist,
  setShowPlaylist,
  loadingPlaylist,
  cancelAddToPlaylist,
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
          onClick={(e) => {
            e.preventDefault();
            setTab("files");
          }}
        >
          {path.join("/")}
        </Link>
        {playlist.id && (
          <Link
            to="#"
            className={`${
              playlist.id && tab !== "files" && "font-bold border-b-2 py-1"
            }`}
            onClick={(e) => {
              e.preventDefault();
              setTab("playlist");
            }}
          >
            Playlist : {playlist.name}
          </Link>
        )}
      </div>
      <div
        id="content-main"
        className="p-2 min-h-[12rem] overflow-y-auto md:flex md:flex-wrap"
      >
        {tab === "files" &&
          files.map((file, i) => (
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
                tab={tab}
                fileSelected={fileSelected}
                playlists={playlists}
                setPlaylists={setPlaylists}
                setActivePlaylist={setActivePlaylist}
              />
            </Link>
          ))}
        {tab === "playlist" &&
          playlist &&
          playlist.files.map((file, i) => (
            <Link
              className="w-full mb-2 lg:w-1/2 xl:w-1/3 xxl:w-1/4"
              key={i + file + "a"}
              to={toUrlParams([
                file.path,
                [...file.path, file.name],
                `?pl=${playlist.id}&fileId=${file.id}`,
              ])}
            >
              <File
                file={file}
                fileSelected={fileSelected}
                playlists={playlists}
                setPlaylists={setPlaylists}
                setActivePlaylist={setActivePlaylist}
                playlist={playlist}
                tab={tab}
              />
            </Link>
          ))}
      </div>
      <AddDirectoriesToPlaylist
        loadingPlaylist={loadingPlaylist}
        cancelAddToPlaylist={cancelAddToPlaylist}
      />
    </>
  );
};

const File = ({
  tab,
  file,
  playlist,
  playlists,
  setPlaylists,
  setActivePlaylist,
  fileSelected,
}) => {
  const [x, setX] = useState(false); // show menu

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

      <button
        className="absolute left-2 bottom-2 rounded-md pl-1 z-10 hover:bg-slate-300 hover:text-black"
        onClick={(e) => {
          e.preventDefault();
          setX(true);
        }}
      >
        ⠇
      </button>

      <div className="px-1 h-[92px] overflow-hidden">
        <p className="break-all">
          {file.name} {tab}
        </p>
      </div>
      {x && (
        <FileMenu
          playlist={playlist}
          playlists={playlists}
          setX={setX}
          tab={tab}
          setPlaylists={setPlaylists}
          setActivePlaylist={setActivePlaylist}
          file={file}
          fileSelected={fileSelected}
        />
      )}
    </div>
  );
};

const AddDirectoriesToPlaylist = ({
  loadingPlaylist = [],
  cancelAddToPlaylist,
}) => {
  const Item = ({ id, dirName, playlistName }) => (
    <div className="flex items-center mb-1">
      <Spinner />{" "}
      <p className="mr-1">
        Adding <span className="font-bold">[{dirName || "dirname"}]</span> to
        palylist{" "}
        <span className="font-bold">[{playlistName || "playlist name"}]</span>
      </p>
      <button
        className="border px-2 bg-slate-400 text-black"
        onClick={() => {
          if (window.confirm(`cancel ${playlistName || ""}?`))
            cancelAddToPlaylist(id || "");
        }}
      >
        x
      </button>
    </div>
  );

  return (
    loadingPlaylist.length > 0 && (
      <div className="w-full border-t mt-auto px-1 pt-1">
        {loadingPlaylist.map((pl, i) => (
          <Item key={pl.id || i} {...pl} />
        ))}
      </div>
    )
  );
};

const FileMenu = ({
  playlist,
  playlists,
  setX,
  setPlaylists,
  setActivePlaylist,
  file,
  tab,
}) => {
  const [menu, setMenu] = useState("");
  const [search] = useSearchParams();
  const fileId = search.get("fileId");
  //console.log(fileId);

  return (
    <div
      className="fixed flex justify-center items-center top-0 left-0 z-40 h-full w-full"
      onClick={(e) => {
        e.preventDefault();
        setX(false);
      }}
    >
      <div className="w-11/12 z-50 h-fit p-2 bg-white dark:bg-slate-700 md:w-[400px]">
        {/* <p className="mb-2 text-xl font-bold">Add to playlist</p> */}
        <p className="mb-2 font-bold">{file.name}</p>

        {menu === "" && tab === "files" && (
          <>
            <button
              className="w-full border px-1 mb-1 break-all font-bold hover:bg-slate-300 hover:text-black"
              onClick={() => {
                setActivePlaylist((prev) => {
                  const newFiles = [...prev.files];
                  newFiles.splice(
                    prev.files.findIndex((f) => f.id === fileId) + 1,
                    0,
                    { ...file, id: v4() }
                  );
                  return { ...prev, files: newFiles };
                });
                setX(false);
              }}
            >
              add to queue
            </button>
            <button
              className={`w-full border px-1 mb-1 break-all ${
                playlists.length > 0
                  ? "font-bold hover:bg-slate-300 hover:text-black"
                  : "line-through"
              }`}
              disabled={playlists.length < 1}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setMenu("playlist");
              }}
            >
              add to playlist
            </button>
          </>
        )}

        {menu === "" && tab === "playlist" && (
          <>
            <button
              className="w-full border px-1 mb-1 break-all font-bold hover:bg-slate-300 hover:text-black"
              onClick={() => {
                setPlaylists((prev) =>
                  prev.map((p) => {
                    if (playlist.id === p.id)
                      return {
                        ...p,
                        files: p.files.filter((pf) => pf.id !== file.id),
                      };
                    return p;
                  })
                );
                setX(false);
              }}
            >
              remove from playlist
            </button>
          </>
        )}

        {menu === "playlist" && (
          <>
            <p className="mb-1">Select playlist : </p>
            <ul>
              {playlists.map((playlist) => (
                <li
                  key={playlist.id}
                  className="w-100 border px-1 mb-1 break-all font-bold hover:bg-slate-300 hover:text-black"
                  onClick={() => {
                    setPlaylists((prev) =>
                      prev.map((pl) =>
                        pl.name !== playlist.name
                          ? pl
                          : {
                              ...pl,
                              files: [...pl.files, { ...file, id: v4() }],
                            }
                      )
                    );
                  }}
                >
                  {playlist.name}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

const Spinner = () => (
  <svg
    role="status"
    className="w-4 h-4 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
    viewBox="0 0 100 101"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
      fill="currentColor"
    ></path>
    <path
      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
      fill="currentFill"
    ></path>
  </svg>
);

export default Main;
