import { useState, useEffect, useRef } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { toUrlParams } from "../helpers";

export default function VideoPlayer(props) {
  const {
    file,
    subtitles,
    videoHistory,
    setVideoHistory,
    autoPlay,
    autoNext,
    nextFile,
    sleep,
  } = props;

  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();

  const video = useRef();
  const videoSource = useRef();

  const { dirParam } = useParams();

  // get start time
  const [search] = useSearchParams();
  const pl = search.get("pl");
  const time =
    search.get("time") && !isNaN(search.get("time"))
      ? parseInt(search.get("time"))
      : null;
  const hst = videoHistory.find((vh) => vh.file.videoSrc === file.videoSrc);
  const startTime = time !== null ? time : hst ? parseInt(hst.currentTime) : 0;

  let iv = useRef(); // interval

  useEffect(() => {
    document.title = `Media Server - ${file.name}`;
    return () => (document.title = "Simple Media Server");
  }, []);

  useEffect(() => {
    console.log(
      "VideoPlayer.js useEffect [file, file.videoSrc, autoPlay, setVideoHistory]"
    );
    if (iv.current) clearInterval(iv.current);
    if (!video) return;

    setIsError(false);
    video.current.load();

    // if (autoPlay) video.current.play();

    iv.current = setInterval(() => {
      const isVideoPlaying =
        video.current.currentTime > 0 &&
        !video.current.paused &&
        !video.current.ended &&
        video.current.readyState > 2;

      if (isVideoPlaying) {
        const historyData = {
          file,
          currentTime: video.current.currentTime,
          duration: video.current.duration,
          date: new Date().toISOString(),
        };
        setVideoHistory((prevData) => {
          if (prevData.find((vh) => vh.file.videoSrc === file.videoSrc))
            return prevData.map((vh) => {
              if (vh.file.videoSrc === file.videoSrc) vh = historyData;
              return vh;
            });
          else return [...prevData, historyData];
        });
      }
    }, 30000);

    return () => {
      clearInterval(iv.current);
    };
  }, [file, file.videoSrc, autoPlay, setVideoHistory]);

  useEffect(() => {
    if (sleep) video.current.pause();
  }, [sleep]);

  const ext = file.name.split(".")[file.name.split(".").length - 1];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex flex-col items-center justify-center w-full mx-auto md:h-72 md:w-auto ${
          !isError ? "hidden" : "bg-red-50"
        }`}
      >
        <p className="text-center font-bold text-2xl">Can't play video :(</p>
        <small>{file.name}</small>
        <Link
          className="px-2 border bg-white rounded-full"
          to={"/" + encodeURIComponent(dirParam)}
        >
          X
        </Link>
      </div>
      <div className="relative">
        {["mp3", "ogg", "wav"].indexOf(ext) !== -1 && (
          <div className="absolute x-0 y-0 w-full h-full flex justify-center items-center text-2xl break-all">
            {ext}
          </div>
        )}
        <video
          ref={video}
          className={`bg-transparent w-full mx-auto md:h-64 md:w-auto ${
            isError ? "hidden" : ""
          }`}
          onError={() => setIsError(true)}
          onEnded={() => {
            if (autoNext && nextFile) {
              navigate(
                toUrlParams([
                  nextFile.path,
                  [...nextFile.path, nextFile.name],
                  `?time=0&pl=${pl}&fileId=${nextFile.id}`,
                ])
              );
            }
          }}
          onLoadedData={(e) => {
            setTimeout(() => {
              if (e.target.currentTime + 10 < startTime)
                e.target.currentTime = startTime;
            }, 1);
          }}
          controls
          autoPlay={true}
          name="media"
        >
          <source ref={videoSource} src={file.videoSrc} type="video/webm" />
          {subtitles.map((subtitle) => (
            <track
              key={"subtitle" + subtitle.lang + subtitle.number}
              kind="subtitles"
              label={subtitle.lang + "_" + subtitle.number}
              src={subtitle.p}
            />
          ))}
        </video>
      </div>
    </div>
  );
}
