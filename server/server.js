import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { VideoSummarizer } from "./services/VideoSummarizer.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const videoSummarizer = new VideoSummarizer();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    credentials: true,
  }),
);

function checkSystemDependencies() {
  return new Promise((resolve, reject) => {
    const ffmpegPath = findFfmpegSync();

    if (!ffmpegPath) {
      reject(
        new Error(
          "FFmpeg 未安装或未找到！\n\n" +
            "请先安装 FFmpeg:\n" +
            "1. 访问 https://ffmpeg.org/download.html\n" +
            "2. 下载 Windows 版本\n" +
            "3. 将 ffmpeg.exe 所在目录添加到系统 PATH\n" +
            "4. 重启命令行后重新启动服务器\n",
        ),
      );
      return;
    }

    console.log(`[FFmpeg] Found at: ${ffmpegPath}`);
    resolve(ffmpegPath);
  });
}

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    exposedHeaders: ["Content-Type", "Content-Disposition"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const downloadsDir = path.join(process.cwd(), "downloads");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

const mockVideoInfo = {
  id: "test-video-123",
  title: "第一视角带你体验电竞网管的工作日常（乡镇网咖篇）",
  thumbnail: "https://picsum.photos/640/360",
  duration: 295,
  url: "https://www.bilibili.com/video/BV1AERFBkB8ei/",
  formats: [
    {
      format_id: "1",
      ext: "mp4",
      width: 1920,
      height: 1080,
      format_note: "1080p",
      filesize: 104857600,
      format: "1080p MP4",
    },
    {
      format_id: "2",
      ext: "mp4",
      width: 1280,
      height: 720,
      format_note: "720p",
      filesize: 52428800,
      format: "720p MP4",
    },
    {
      format_id: "3",
      ext: "mp4",
      width: 854,
      height: 480,
      format_note: "480p",
      filesize: 26214400,
      format: "480p MP4",
    },
    {
      format_id: "4",
      ext: "mp4",
      width: 640,
      height: 360,
      format_note: "360p",
      filesize: 13107200,
      format: "360p MP4",
    },
    {
      format_id: "5",
      ext: "mp3",
      format_note: "audio",
      filesize: 5242880,
      format: "Audio MP3",
    },
  ],
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

function fetchThumbnailAsBase64(url) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === "https:" ? https : http;

      const options = {
        headers: {
          Referer: parsedUrl.origin,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        timeout: 10000,
      };

      const request = protocol.get(url, options, (response) => {
        if (response.statusCode !== 200) {
          console.log(`[Thumbnail] Failed: Status ${response.statusCode}`);
          resolve(null);
          return;
        }

        const contentType = response.headers["content-type"] || "image/jpeg";
        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString("base64");
          const dataUrl = `data:${contentType};base64,${base64}`;
          resolve(dataUrl);
        });
      });

      request.on("error", (err) => {
        console.error(`[Thumbnail] Error: ${err.message}`);
        resolve(null);
      });

      request.on("timeout", () => {
        console.error(`[Thumbnail] Timeout`);
        request.destroy();
        resolve(null);
      });

      request.end();
    } catch (err) {
      console.error(`[Thumbnail] Exception: ${err.message}`);
      resolve(null);
    }
  });
}

app.get("/api/proxy-image", (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  console.log(`[Proxy Image] Fetching: ${url}`);

  try {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      headers: {
        Referer: parsedUrl.origin,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      timeout: 10000,
    };

    const request = protocol.get(url, options, (response) => {
      console.log(`[Proxy Image] Response status: ${response.statusCode}`);

      if (response.statusCode !== 200) {
        console.log(`[Proxy Image] Failed: Status ${response.statusCode}`);
        res.status(500).json({
          error: `Failed to fetch image, status: ${response.statusCode}`,
        });
        return;
      }

      const contentType = response.headers["content-type"] || "image/jpeg";
      const contentLength = response.headers["content-length"];
      console.log(
        `[Proxy Image] Content-Type: ${contentType}, Content-Length: ${contentLength}`,
      );

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Access-Control-Allow-Origin", "*");

      response.pipe(res);
    });

    request.on("error", (err) => {
      console.error(`[Proxy Image] Error: ${err.message}`);
      res.status(500).json({ error: err.message });
    });

    request.on("timeout", () => {
      console.error(`[Proxy Image] Timeout`);
      request.destroy();
      res.status(504).json({ error: "Request timeout" });
    });

    request.end();
  } catch (err) {
    console.error(`[Proxy Image] Exception: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

async function findFfmpeg() {
  const paths = [
    "ffmpeg",
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "D:\\tools\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\Users\\96548\\Downloads\\ffmpeg\\bin\\ffmpeg.exe",
  ];

  for (const path of paths) {
    const result = await new Promise((resolve) => {
      const check = spawn(path, ["-version"]);
      check.on("close", (code) => {
        resolve(code === 0);
      });
      check.on("error", () => {
        resolve(false);
      });
    });

    if (result) {
      return path;
    }
  }

  return null;
}

function findFfmpegSync() {
  const paths = [
    "ffmpeg",
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "D:\\tools\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\Users\\96548\\Downloads\\ffmpeg\\bin\\ffmpeg.exe",
  ];

  for (const pathStr of paths) {
    try {
      execSync(`"${pathStr}" -version`, {
        stdio: "ignore",
        shell: true,
        windowsHide: true,
      });
      console.log(`[FFmpeg] Found at: ${pathStr}`);
      return pathStr;
    } catch (e) {
      continue;
    }
  }

  return null;
}

app.post("/api/download", async (req, res) => {
  const { url, format = "mp4", quality = "best" } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const videoId = Date.now().toString();
    const outputPath = path.join(downloadsDir, `${videoId}.%(ext)s`);
    const mergedOutputPath = path.join(downloadsDir, `${videoId}_merged.mp4`);

    const ffmpegPath = findFfmpegSync();
    if (!ffmpegPath) {
      return res
        .status(500)
        .json({ error: "FFmpeg 不可用，请确保已安装 FFmpeg" });
    }

    if (format === "mp3") {
      const args = [
        "-o",
        outputPath,
        "--no-warnings",
        "--progress",
        "--newline",
        "-v",
        "-f",
        "bestaudio/best",
        "-x",
        "--audio-format",
        "mp3",
        url,
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const sendProgress = (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      };

      sendProgress({ status: "starting", progress: 0 });

      const ytdlp = spawn("yt-dlp", args);

      let lastProgress = 0;

      ytdlp.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`[Download stdout] ${output.trim()}`);
        const lines = output.split("\n");

        for (const line of lines) {
          const downloadProgressMatch = line.match(
            /\[download\]\s*(\d+\.?\d*)%\s+of/,
          );

          if (downloadProgressMatch) {
            const progress = Math.round(parseFloat(downloadProgressMatch[1]));
            if (progress !== lastProgress && progress <= 100) {
              lastProgress = progress;
              sendProgress({ status: "downloading", progress: progress });
            }
          }
        }
      });

      ytdlp.stderr.on("data", (data) => {
        const output = data.toString();
        console.log(`[Download stderr] ${output.trim()}`);
      });

      ytdlp.on("close", (code) => {
        if (code === 0) {
          const files = fs.readdirSync(downloadsDir);
          const downloadedFile = files.find(
            (file) => file.startsWith(videoId) && file.endsWith(".mp3"),
          );

          if (downloadedFile) {
            const filePath = path.join(downloadsDir, downloadedFile);

            try {
              const stats = fs.statSync(filePath);

              if (stats.size === 0) {
                sendProgress({
                  status: "error",
                  progress: 0,
                  error: "下载的文件大小为0，可能下载失败",
                });
                res.end();
                return;
              }

              sendProgress({
                status: "completed",
                progress: 100,
                fileName: downloadedFile,
                fileSize: stats.size,
                downloadUrl: `/download/${downloadedFile}`,
              });
            } catch (err) {
              sendProgress({
                status: "error",
                progress: 0,
                error: "无法读取下载文件",
              });
            }
          } else {
            sendProgress({
              status: "error",
              progress: 0,
              error: "下载完成但未找到文件，请检查 downloads 目录",
            });
          }
        } else {
          sendProgress({
            status: "error",
            progress: 0,
            error: `下载失败，错误码: ${code}`,
          });
        }
        res.end();
      });

      ytdlp.on("error", (err) => {
        sendProgress({
          status: "error",
          progress: 0,
          error: `Failed to start download: ${err.message}`,
        });
        res.end();
      });
    } else {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const sendProgress = (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      };

      sendProgress({ status: "starting", progress: 0 });

      const videoArgs = [
        "-o",
        path.join(downloadsDir, `${videoId}_video.mp4`),
        "--no-warnings",
        "--progress",
        "--newline",
        "-v",
        "-f",
        "bestvideo",
        url,
      ];

      const audioArgs = [
        "-o",
        path.join(downloadsDir, `${videoId}_audio.m4a`),
        "--no-warnings",
        "--progress",
        "--newline",
        "-v",
        "-f",
        "bestaudio",
        url,
      ];

      console.log(
        `[Download] Downloading video with args: ${videoArgs.join(" ")}`,
      );
      console.log(
        `[Download] Downloading audio with args: ${audioArgs.join(" ")}`,
      );

      const downloadVideo = () => {
        return new Promise((resolve, reject) => {
          const ytdlp = spawn("yt-dlp", videoArgs);

          ytdlp.on("close", (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`视频下载失败，错误码: ${code}`));
            }
          });

          ytdlp.on("error", (err) => {
            reject(err);
          });
        });
      };

      const downloadAudio = () => {
        return new Promise((resolve, reject) => {
          const ytdlp = spawn("yt-dlp", audioArgs);

          ytdlp.on("close", (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`音频下载失败，错误码: ${code}`));
            }
          });

          ytdlp.on("error", (err) => {
            reject(err);
          });
        });
      };

      try {
        sendProgress({ status: "downloading", progress: 10 });
        await Promise.all([downloadVideo(), downloadAudio()]);
        sendProgress({ status: "downloading", progress: 90 });

        console.log("[Download] Merging video and audio with ffmpeg");
        sendProgress({ status: "processing", progress: 95 });

        const videoFile = path.join(downloadsDir, `${videoId}_video.mp4`);
        const audioFile = path.join(downloadsDir, `${videoId}_audio.m4a`);

        if (!fs.existsSync(videoFile) || !fs.existsSync(audioFile)) {
          throw new Error("视频或音频文件下载失败");
        }

        const ffmpegArgs = [
          "-i",
          videoFile,
          "-i",
          audioFile,
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-y",
          mergedOutputPath,
        ];

        console.log(`[Download] FFmpeg args: ${ffmpegArgs.join(" ")}`);

        const ffmpeg = spawn(ffmpegPath, ffmpegArgs);

        ffmpeg.on("close", (code) => {
          if (code === 0) {
            fs.unlinkSync(videoFile);
            fs.unlinkSync(audioFile);

            const stats = fs.statSync(mergedOutputPath);
            const finalFileName = `${videoId}.mp4`;
            const finalFilePath = path.join(downloadsDir, finalFileName);
            fs.renameSync(mergedOutputPath, finalFilePath);

            sendProgress({
              status: "completed",
              progress: 100,
              fileName: finalFileName,
              fileSize: stats.size,
              downloadUrl: `/download/${finalFileName}`,
            });
          } else {
            sendProgress({
              status: "error",
              progress: 0,
              error: `FFmpeg 合并失败，错误码: ${code}`,
            });
          }
          res.end();
        });

        ffmpeg.on("error", (err) => {
          sendProgress({
            status: "error",
            progress: 0,
            error: `FFmpeg 启动失败: ${err.message}`,
          });
          res.end();
        });
      } catch (err) {
        sendProgress({
          status: "error",
          progress: 0,
          error: err.message,
        });
        res.end();
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/summary", async (req, res) => {
  const { url, mode = "detailed" } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: "URL is required" });
  }

  console.log(`[Summary] Processing URL: ${url}, mode: ${mode}`);

  try {
    const result = await videoSummarizer.summarize(url, { mode });
    res.json(result);
  } catch (error) {
    console.error("[Summary] Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/summarize", async (req, res) => {
  const { url, mode = "detailed" } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: "URL is required" });
  }

  console.log(`[Summarize SSE] Processing URL: ${url}, mode: ${mode}`);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    console.log("[Summarize SSE] Starting stream...");
    const stream = videoSummarizer.summarizeStream(url, { mode });
    for await (const event of stream) {
      console.log("[Summarize SSE] Sending event:", event.status);
      sendEvent(event);
    }
    console.log("[Summarize SSE] Stream completed");
  } catch (error) {
    console.error("[Summarize SSE] Error:", error.message);
    sendEvent({ status: "error", message: error.message });
  } finally {
    res.end();
  }
});

app.post("/api/chat", async (req, res) => {
  const { message, context = {} } = req.body;

  if (!message) {
    return res
      .status(400)
      .json({ success: false, error: "Message is required" });
  }

  console.log(`[Chat] Processing message: ${message.substring(0, 50)}...`);

  try {
    const result = await videoSummarizer.chat(message, context);
    res.json(result);
  } catch (error) {
    console.error("[Chat] Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/chat/stream", async (req, res) => {
  const { message, subtitleText = "" } = req.body;

  if (!message) {
    return res
      .status(400)
      .json({ success: false, error: "Message is required" });
  }

  console.log(`[Chat SSE] Processing message: ${message.substring(0, 50)}...`);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    let currentText = subtitleText;

    if (!currentText.trim()) {
      const extractor = videoSummarizer.subtitleExtractor;
      const result = await extractor.extract(message);
      if (!result.text || result.text.length === 0) {
        sendEvent({ status: "error", message: "无法提取视频字幕" });
        res.end();
        return;
      }
      currentText = result.text;
    }

    const stream = videoSummarizer.chatStream(currentText, message);
    for await (const token of stream) {
      sendEvent({ status: "answer", content: token });
    }
    sendEvent({ status: "done" });
  } catch (error) {
    console.error("[Chat SSE] Error:", error.message);
    sendEvent({ status: "error", message: error.message });
  } finally {
    res.end();
  }
});

app.post("/api/info", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const useMockData = false;

    if (useMockData) {
      setTimeout(() => {
        const formats = mockVideoInfo.formats.map((f) => ({
          id: f.format_id || Math.random().toString(36).substr(2, 9),
          format: f.format || "unknown",
          resolution: getResolution(f),
          size: getFileSize(f),
          ext: f.ext || "mp4",
        }));

        res.json({
          success: true,
          info: {
            id: mockVideoInfo.id,
            title: mockVideoInfo.title,
            thumbnail: mockVideoInfo.thumbnail,
            duration: mockVideoInfo.duration,
            url: mockVideoInfo.url,
            formats: formats,
          },
        });
      }, 500);
      return;
    }

    const ytdlpArgs = ["-J", "--no-warnings", "--skip-download", url];

    const ytdlp = spawn("yt-dlp", ytdlpArgs, { timeout: 30000 });

    let output = "";
    let errorOutput = "";
    let timeout = false;

    const timeoutId = setTimeout(() => {
      timeout = true;
      ytdlp.kill();
    }, 30000);

    ytdlp.stdout.on("data", (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on("close", (code) => {
      clearTimeout(timeoutId);

      if (timeout) {
        return res.status(500).json({
          error: "Request timed out",
          details: "yt-dlp took too long to respond",
        });
      }

      if (code === 0) {
        (async () => {
          try {
            const info = JSON.parse(output);

            console.log(
              "Received info:",
              JSON.stringify({
                hasTitle: !!info.title,
                hasThumbnail: !!info.thumbnail,
                hasFormats: !!info.formats && info.formats.length > 0,
                formatCount: info.formats ? info.formats.length : 0,
              }),
            );

            const thumbnail = getThumbnail(info);
            const durationSeconds = info.duration || 0;
            const durationFormatted = formatDuration(durationSeconds);

            const formats = info.formats
              ? info.formats
                  .filter(
                    (f) =>
                      f.ext &&
                      ["mp4", "mp3", "webm", "mkv"].includes(f.ext) &&
                      f.vcodec !== "none",
                  )
                  .map((f) => ({
                    id: f.format_id || Math.random().toString(36).substr(2, 9),
                    format: f.format || "unknown",
                    resolution: getResolution(f),
                    size: getFileSize(f),
                    ext: f.ext || "mp4",
                    width: f.width,
                    height: f.height,
                  }))
              : [];

            const uniqueFormats = [];
            const seenResolutions = new Set();

            for (const format of formats) {
              const key = `${format.resolution}-${format.ext}`;
              if (!seenResolutions.has(key)) {
                seenResolutions.add(key);
                uniqueFormats.push(format);
              }
            }

            if (uniqueFormats.length === 0) {
              return res.status(400).json({
                error: "该视频暂不支持下载",
                details: "未找到可用的视频格式",
              });
            }

            console.log("Formats extracted:", uniqueFormats.length);

            const thumbnailUrl = getThumbnail(info);
            const base64Thumbnail = thumbnailUrl
              ? await fetchThumbnailAsBase64(thumbnailUrl)
              : null;
            console.log(`[Thumbnail] Base64 fetched: ${!!base64Thumbnail}`);

            res.json({
              success: true,
              info: {
                id: info.id || Math.random().toString(36).substr(2, 9),
                title: info.title || "Unknown Title",
                thumbnail: base64Thumbnail || thumbnailUrl,
                duration: durationFormatted,
                url: info.webpage_url || info.url || req.body.url,
                formats: uniqueFormats.slice(0, 8),
              },
            });
          } catch (parseError) {
            res.status(500).json({
              error: "Failed to parse video info",
              details: parseError.message,
              rawOutput: output.substring(0, 1000),
            });
          }
        })();
      } else {
        res.status(500).json({
          error: "Failed to get video info",
          details: errorOutput || output,
        });
      }
    });

    ytdlp.on("error", (err) => {
      clearTimeout(timeoutId);
      res
        .status(500)
        .json({ error: "Failed to start yt-dlp", details: err.message });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getThumbnail(info) {
  if (info.thumbnail) return info.thumbnail;
  if (info.thumbnails && info.thumbnails.length > 0) {
    const sorted = [...info.thumbnails].sort((a, b) => {
      const aSize = (a.width || 0) * (a.height || 0);
      const bSize = (b.width || 0) * (b.height || 0);
      return bSize - aSize;
    });
    return sorted[0].url || sorted[0].filename || "";
  }
  return "https://picsum.photos/640/360";
}

function getResolution(format) {
  if (format.resolution && format.resolution !== "unknown") {
    return format.resolution;
  }
  if (format.format_note && format.format_note !== "unknown") {
    return format.format_note;
  }
  if (format.width && format.height) {
    return `${format.width}x${format.height}`;
  }
  if (format.height) {
    return `${format.height}p`;
  }
  if (format.width) {
    return `${format.width}w`;
  }
  return "unknown";
}

function getFileSize(format) {
  const size = format.filesize || format.filesize_approx;
  if (size) {
    return formatFileSize(size);
  }
  return "unknown";
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(downloadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const contentType = filename.endsWith(".mp4")
    ? "video/mp4"
    : filename.endsWith(".mp3")
      ? "audio/mpeg"
      : "application/octet-stream";

  res.set({
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    "Content-Length": fileSize,
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

async function startServer() {
  try {
    await checkSystemDependencies();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log("系统依赖检查通过: FFmpeg 已就绪");
    });
  } catch (error) {
    console.error("\n❌ 启动失败:", error.message);
    process.exit(1);
  }
}

startServer();
