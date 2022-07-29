const express = require("express");
const path = require("path");
exports.serverPath = __dirname;

const {
  getDirs,
  getMimeType,
  getFileStream,
  getThumbnailStream,
  getMkvSubtitles,
} = require("./services/file-sevice");

const { PORT } = require("./config");
const app = express();
app.use(express.json());
app.listen(PORT, "0.0.0.0", () =>
  console.log(`server up! listening on PORT:${PORT}.. ${this.serverPath}`)
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
    res.json(dirs);
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
    const thumbnail = await getThumbnailStream(JSON.parse(req.params.p));
    res.set({ "Content-type": "image/png" });
    thumbnail.pipe(res);
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
  console.log(error);
  return res.status(500).send("unknown error");
}

app.use(express.static(path.resolve(__dirname, "../build")));
app.get("*", (req, res) =>
  res.sendFile(path.resolve(__dirname, "../build", "index.html"))
);
