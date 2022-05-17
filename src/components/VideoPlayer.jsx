import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function VideoPlayer(props) {
  const {
    file,
    subtitles,
    videoHistory,
    setVideoHistory,
    autoPlay,
    autoNext,
    nextFile,
  } = props;

  const [isError, setIsError] = useState(false);

  const video = useRef();
  const videoSource = useRef();

  const { dirParam } = useParams();

  let iv = useRef();

  const navigate = useNavigate();

  useEffect(() => {
    if (iv.current) clearInterval(iv.current);
    if (!video.current) return;

    setIsError(false);
    video.current.load();
    if (autoPlay) video.current.play();

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
    }, 10000);

    return () => {
      clearInterval(iv.current);
    };
  }, [file, file.videoSrc, setVideoHistory]);

  useEffect(() => {
    const history = videoHistory.find(
      (vh) => vh.file.videoSrc === file.videoSrc
    );
    if (
      history &&
      Math.round(video.current.currentTime) !== Math.round(history.currentTime)
    )
      video.current.currentTime = history.currentTime;
  }, [file.videoSrc, videoHistory]);

  const renderVideo = useMemo(
    () => (
      <>
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
        <video
          ref={video}
          className={`w-full mx-auto md:h-72 md:w-auto ${
            isError ? "hidden" : ""
          }`}
          onError={() => setIsError(true)}
          onEnded={() => {
            if (autoNext && nextFile)
              navigate(
                "/" +
                  encodeURIComponent(JSON.stringify(nextFile.path)) +
                  "/" +
                  encodeURIComponent(
                    JSON.stringify([...nextFile.path, nextFile.name])
                  )
              );
          }}
          controls
        >
          <source ref={videoSource} src={file.videoSrc} />
          {subtitles.map((subtitle) => (
            <track
              key={"subtitle" + subtitle.lang + subtitle.number}
              kind="subtitles"
              label={subtitle.lang + "_" + subtitle.number}
              src={subtitle.p}
            />
          ))}
        </video>
      </>
    ),
    [
      file.videoSrc,
      file.name,
      dirParam,
      isError,
      subtitles,
      autoPlay,
      nextFile,
      navigate,
    ]
  );

  return renderVideo;
}
