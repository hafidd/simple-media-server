import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import VideoPlayer from "./VideoPlayer";

export default function Main(props) {
  const {
    className = "",
    dirs,
    path,
    files,
    filterName,
    fileSelected,
    subtitles,
    videoHistory,
    fav,
    setFavorites,
    loadingSubtitles,
    setFilterName,
    setVideoHistory,
  } = props;

  const [autoPlay, setAutoPlay] = useState(false);
  const [autoNext, setAutoNext] = useState(false);

  const nextFile =
    fileSelected &&
    path.length > 1 &&
    files[files.findIndex((file) => file.name === fileSelected.name) + 1];

  const prevFile =
    fileSelected &&
    path.length > 1 &&
    files[files.findIndex((file) => file.name === fileSelected.name) - 1];

  const renderVideo = useMemo(() => {
    return fileSelected !== null ? (
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
                to={
                  "/" +
                  encodeURIComponent(JSON.stringify(prevFile.path)) +
                  "/" +
                  encodeURIComponent(
                    JSON.stringify([...prevFile.path, prevFile.name])
                  )
                }
              >
                ⏮
              </Link>
            )}
            {nextFile && (
              <Link
                className="text-base font-bold px-1 border rounded-md mr-1"
                to={
                  "/" +
                  encodeURIComponent(JSON.stringify(nextFile.path)) +
                  "/" +
                  encodeURIComponent(
                    JSON.stringify([...nextFile.path, nextFile.name])
                  )
                }
              >
                ⏭
              </Link>
            )}
            <Link
              className="text-base font-bold px-1 border rounded-md mr-1"
              to="#"
              onClick={() => setAutoPlay((prev) => !prev)}
            >
              autoplay {autoPlay ? "on" : "off"}
            </Link>
            <Link
              className="text-base font-bold px-1 border rounded-md mr-1"
              to="#"
              onClick={() => setAutoNext((prev) => !prev)}
            >
              autonext {autoNext ? "on" : "off"}
            </Link>
          </div>
        </div>
      </div>
    ) : (
      ""
    );
  }, [
    fileSelected,
    subtitles,
    videoHistory,
    setVideoHistory,
    loadingSubtitles,
    nextFile,
    prevFile,
    autoPlay,
    autoNext,
    setAutoPlay,
    setAutoNext,
  ]);

  return (
    <div className={className}>
      {renderVideo}

      {/* filter */}
      <div className="border-y flex">
        {filterName && <div className="p-2 font-bold">Filter : </div>}
        <input
          type="search"
          id="filter"
          className="flex-1 p-2 focus:outline-none"
          placeholder="filter..."
          defaultValue={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
      </div>

      {/* menus */}
      <div className="p-2 w-full">
        {path.length > 0 && (
          <Link
            className="ml-1 font-bold px-2 py-1 border"
            to={
              "/" +
              encodeURIComponent(
                JSON.stringify([...path].splice(0, path.length - 1))
              ) +
              "/" +
              (fileSelected !== null
                ? encodeURIComponent(
                    JSON.stringify([...fileSelected.path, fileSelected.name])
                  )
                : "")
            }
          >
            ..
          </Link>
        )}
        <Link className="ml-1 font-bold px-2 py-1 border" to="/">
          go 🏠
        </Link>
        <div className="float-right">
          <button
            className="font-bold border px-2 py-1"
            onClick={() => {
              if (
                window.confirm(
                  "Set " + JSON.stringify(path) + " as starting directory?"
                )
              ) {
                window.localStorage.setItem(
                  "settings",
                  JSON.stringify({ startDir: path })
                );
              }
            }}
          >
            set 🏠
          </button>
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
        </div>
      </div>

      {/* dirs */}
      <div id="dir-main" className="md:hidden">
        <div
          className={`flex mb-1 
            ${
              fileSelected === null
                ? "flex-wrap max-h-40 overflow-y-auto px-2"
                : "overflow-x-auto"
            }
            `}
        >
          {dirs.map((dir, i) => (
            <Link
              key={dir + i + "dir2"}
              className={`mr-1 ${
                fileSelected !== null
                  ? "whitespace-nowrap"
                  : "mb-1 break-all text-center"
              } px-2 py-1 bg-slate-100`}
              to={
                "/" +
                encodeURIComponent(JSON.stringify([...path, dir])) +
                "/" +
                (fileSelected !== null
                  ? encodeURIComponent(
                      JSON.stringify([...fileSelected.path, fileSelected.name])
                    )
                  : "")
              }
            >
              {dir}
            </Link>
          ))}
        </div>
      </div>

      {/* files */}
      <div
        id="content-main"
        className="p-2 min-h-[12rem] overflow-y-auto md:flex md:flex-wrap"
      >
        {files.map((file, i) => (
          <Link
            className="w-full mb-2 lg:w-1/2 xl:w-1/3 xxl:w-1/4"
            key={i + file + "a"}
            to={
              "/" +
              encodeURIComponent(JSON.stringify(file.path)) +
              "/" +
              encodeURIComponent(JSON.stringify([...file.path, file.name]))
            }
          >
            <File file={file} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function File({ file }) {
  return (
    <div className="p-1 flex">
      <img
        src={file.imgSrc}
        alt="img"
        className="h-[92px] w-[140px] bg-slate-400 flex-shrink-0"
        loading="lazy"
      />
      <div className="px-1 h-[92px] overflow-hidden">
        <p className="break-all">{file.name}</p>
      </div>
    </div>
  );
}
