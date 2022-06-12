const express = require("express");
const path = require("path");

const {
  getDirs,
  getFiles,
  getMimeType,
  getFileStream,
  getThumbnailStream,
  getMkvSubtitles,
  testy,
} = require("./services/file-sevice");

const { PORT } = require("./config");
const app = express();
app.use(express.json({ limit: "10mb" }));
app.listen(PORT, "0.0.0.0", () =>
  console.log(`server up! listening on PORT:${PORT}..`)
);

// sementara
app.get("/old", (req, res) => {
  const path = require("path");
  res.sendFile(path.resolve(path.join("server", "html", "index.html")));
});

// get directory and file list {dirs: [], files: []}
app.get(["/dir", "/dir/:p"], async (req, res) => {
  try {
    const pathArr = req.params.p ? JSON.parse(req.params.p) : [];
    const dirs = await getDirs(pathArr);
    console.log(pathArr, { dirs: dirs.dirs.length, files: dirs.files.length });
    //const xx = { ...dirs, files: dirs.files.splice(0, 39) };
    res.json(dirs);
  } catch (error) {
    __sendErrorResponse(error, res);
  }
});

global.scanIds = ["test"];

// get all files
app.get(["/files/:p/:id"], async (req, res) => {
  const id = req.params.id;
  try {
    const pathArr = req.params.p ? JSON.parse(req.params.p) : [];

    console.log("scanning", pathArr);
    console.log("ID", id);
    const startTime = process.hrtime();

    scanIds = [...scanIds, id];
    const files = await getFiles({ dirPath: pathArr, id });

    const totalTime = process.hrtime(startTime);
    const time = totalTime[0] * 1000 + totalTime[1] / 1e6;
    if (!scanIds.find((scan) => scan === id)) {
      console.log(id, "cancelled");
      const err = new Error();
      err.status = 400;
      err.message = "process canceled";
      throw err;
    }
    scanIds = scanIds.filter((scan) => scan !== id);

    console.log(
      `completed! found ${files.length} files. (${Math.trunc(time / 1000)}sec)`
    );
    res.json(files);
  } catch (error) {
    scanIds = scanIds.filter((scan) => scan !== id);
    __sendErrorResponse(error, res);
  }
});

app.get(["/cancel/:id"], async (req, res) => {
  try {
    scanIds = scanIds.filter((scan) => scan !== req.params.id);
    res.json("ok");
  } catch (error) {
    __sendErrorResponse(error, res);
  }
});

app.get(["/testx"], async (req, res) => {
  try {
    console.log(testy());
    res.send("ok");
  } catch (error) {
    __sendErrorResponse(error, res);
  }
});

// get video stream
app.get("/video/:p", (req, res) => {
  try {
    const arrPath = JSON.parse(req.params.p);

    const fileExt = path.extname(arrPath[arrPath.length - 1]).replace(".", "");
    const contentType = getMimeType(fileExt);

    const file = getFileStream({ range: req.headers.range, arrPath });
    if (req.headers.range) {
      res.status(206);
      res.set({
        "Content-Range":
          "bytes " +
          file.stats.start +
          "-" +
          file.stats.end +
          "/" +
          file.stats.total,
        "Accept-Ranges": "bytes",
        "Content-Length": file.stats.chunksize,
        "Content-Type": contentType,
      });
      file.stream.pipe(res);
    } else {
      res.status(200);
      res.set({
        "Content-Length": file.total,
        "Content-Type": contentType,
      });
      file.stream.pipe(res);
    }
  } catch (error) {
    __sendErrorResponse(error, res);
  }
});

// get video thumbnail
app.get("/video/:p/thumbnail", async (req, res) => {
  try {
    const arrPath = JSON.parse(req.params.p);
    const fileExt = path.extname(arrPath[arrPath.length - 1]).replace(".", "");
    res.set({ "Content-type": "image/png" });
    // audio
    if (["mp3", "ogg", "wav"].indexOf(fileExt) !== -1) {
      const thumbnail = getFileStream({
        arrPath: [__dirname, "files", "sound.jpg"],
      });
      thumbnail.stream.pipe(res);
    } else {
      // video
      const thumbnail = await getThumbnailStream(arrPath);
      thumbnail.pipe(res);
    }
  } catch (error) {
    __sendErrorResponse(error, res);
  }
});

// get video subtitles
app.get("/video/:p/subtitles", async (req, res) => {
  try {
    const arrPath = JSON.parse(req.params.p);
    if (path.extname(arrPath[arrPath.length - 1]).replace(".", "") !== "mkv")
      return res.send([]);
    const subtitles = await getMkvSubtitles(arrPath);
    res.send(subtitles);
  } catch (error) {
    console.log(error);
    res.send([]);
  }
});

// get subtitle stream
app.get("/subtitle/:p", (req, res) => {
  try {
    const file = getFileStream({ stringPath: req.params.p });
    res.status(200);
    res.set({
      "Content-Length": file.total,
      "Content-Type": "text/vtt",
    });
    file.stream.pipe(res);
  } catch (error) {
    __sendErrorResponse(error, res);
  }
});

// get media src, subtitles(for mkv)
// gk kepake
app.get("/play/:p", (req, res) => {
  res.send({
    src: `/video/${encodeURIComponent(req.params.p)}`,
    subtitles: `/video/${encodeURIComponent(req.params.p)}/subtitles`,
  });
});

function __sendErrorResponse(error, res) {
  if (error.status) return res.status(error.status).send(error.message);
  if (error instanceof SyntaxError) return res.status(404).send("not found");
  //
  console.log(error);
  return res.status(500).send("unknown error");
}

app.use(express.static(path.resolve(__dirname, "../build")));
app.get("*", (req, res) =>
  res.sendFile(path.resolve(__dirname, "../build", "index.html"))
);
