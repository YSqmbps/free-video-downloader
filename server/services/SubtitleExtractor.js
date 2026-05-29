import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import https from "https";

export class SubtitleExtractor {
  PREFERRED_LANGS = ["zh-Hans", "zh", "zh-CN", "en", "ja", "ko"];

  constructor() {
    this.tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async extract(url) {
    if (this._isBilibiliUrl(url)) {
      const bilibiliResult = await this._extractBilibili(url);
      if (bilibiliResult.has_subtitle) {
        return {
          success: true,
          text: bilibiliResult.full_text,
          format: "json3",
          length: bilibiliResult.full_text.length,
          segments: bilibiliResult.segments,
          language: bilibiliResult.language,
          subtitle_type: bilibiliResult.subtitle_type,
        };
      } else if (bilibiliResult.error) {
        console.log(
          `[SubtitleExtractor] Bilibili API error: ${bilibiliResult.error}`,
        );
      }
    }

    try {
      const result = await this._extractWithYtDlp(url);
      return result;
    } catch (ytDlpError) {
      if (this._isBilibiliUrl(url)) {
        throw new Error(
          `无法提取字幕：该视频可能没有字幕，或需要登录才能访问。${ytDlpError.message}`,
        );
      }
      throw ytDlpError;
    }
  }

  _isBilibiliUrl(url) {
    return url.includes("bilibili.com") || url.includes("b23.tv");
  }

  async _extractBilibili(url) {
    const empty = {
      has_subtitle: false,
      language: "",
      subtitle_type: "none",
      segments: [],
      full_text: "",
      error: "",
    };

    try {
      const bvid = this._parseBvid(url);
      if (!bvid) {
        return { ...empty, error: "无法解析BV号" };
      }

      const headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `https://www.bilibili.com/video/${bvid}`,
        Accept: "application/json, text/plain, */*",
      };

      const viewData = await this._fetchJson(
        `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
        headers,
      );

      if (viewData.code !== 0) {
        return {
          ...empty,
          error: `API错误: ${viewData.message || viewData.code}`,
        };
      }

      const cid = viewData.data?.cid;
      const aid = viewData.data?.aid;
      if (!cid || !aid) {
        return { ...empty, error: "无法获取视频CID或AID" };
      }

      const dmData = await this._fetchJson(
        `https://api.bilibili.com/x/v2/dm/view?aid=${aid}&oid=${cid}&type=1`,
        headers,
      );

      if (dmData.code !== 0 && dmData.code !== undefined) {
        return {
          ...empty,
          error: `字幕API错误: ${dmData.message || dmData.code}`,
        };
      }

      const subtitleList = dmData.data?.subtitle?.subtitles || [];
      if (!subtitleList || subtitleList.length === 0) {
        return { ...empty, error: "该视频没有字幕" };
      }

      let bestSub = subtitleList[0];
      for (const sub of subtitleList) {
        const lang = sub.lan || "";
        if (lang === "zh" || lang === "zh-Hans") {
          bestSub = sub;
          break;
        }
      }

      const subType = bestSub.lan?.startsWith("ai-") ? "auto" : "manual";
      let subUrl = bestSub.subtitle_url || "";

      if (subUrl.startsWith("//")) {
        subUrl = "https:" + subUrl;
      } else if (subUrl.startsWith("http://")) {
        subUrl = "https://" + subUrl.substring(7);
      }

      if (!subUrl) {
        return { ...empty, error: "字幕URL为空" };
      }

      const subJson = await this._fetchJson(subUrl, headers);
      const body = subJson.body || [];

      if (!Array.isArray(body) || body.length === 0) {
        return { ...empty, error: "字幕内容为空" };
      }

      const segments = [];
      for (const item of body) {
        const content = (item.content || "").trim();
        if (!content) continue;
        segments.push({
          start: Math.round(item.from * 100) / 100,
          end: Math.round(item.to * 100) / 100,
          text: content,
        });
      }

      if (segments.length === 0) {
        return { ...empty, error: "解析字幕失败" };
      }

      const fullText = segments.map((s) => s.text).join(" ");

      return {
        has_subtitle: true,
        language: bestSub.lan || "zh",
        subtitle_type: subType,
        segments: segments,
        full_text: fullText,
        error: "",
      };
    } catch (error) {
      console.error(
        "[SubtitleExtractor] Bilibili extraction error:",
        error.message,
      );
      return { ...empty, error: error.message };
    }
  }

  _parseBvid(url) {
    const match = url.match(/(BV[a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  _fetchJson(url, headers) {
    return new Promise((resolve, reject) => {
      const options = {
        headers: headers,
        timeout: 15000,
      };

      const req = https.get(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse JSON"));
          }
        });
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.on("error", (e) => {
        reject(e);
      });
    });
  }

  async _extractWithYtDlp(url) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const tempFile = path.join(this.tempDir, `subs_${timestamp}.%(ext)s`);

      const cookiesPath = path.join(process.cwd(), "cookies.txt");
      const hasCookies = fs.existsSync(cookiesPath);

      const args = [
        "--write-auto-sub",
        "--write-sub",
        "--sub-lang",
        this.PREFERRED_LANGS.join(","),
        "--sub-format",
        "json3,vtt,srt,ass",
        "--skip-download",
        "--no-warnings",
        "-o",
        tempFile,
      ];

      if (hasCookies) {
        args.push("--cookies", cookiesPath);
      }

      args.push(url);

      console.log(`[SubtitleExtractor] Extracting subtitles from: ${url}`);

      const ytdlp = spawn("yt-dlp", args, { timeout: 120000 });

      let errorOutput = "";
      let timeout = false;

      const timeoutId = setTimeout(() => {
        timeout = true;
        ytdlp.kill();
      }, 120000);

      ytdlp.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      ytdlp.on("close", (code) => {
        clearTimeout(timeoutId);

        if (timeout) {
          reject(new Error("提取字幕超时"));
          return;
        }

        if (code === 0) {
          this._processSubtitleFiles(timestamp)
            .then((result) => resolve(result))
            .catch((err) => reject(err));
        } else {
          const cleanedError = this._cleanError(errorOutput);
          reject(new Error(`提取字幕失败: ${cleanedError || "Unknown error"}`));
        }
      });

      ytdlp.on("error", (err) => {
        clearTimeout(timeoutId);
        reject(new Error(`启动yt-dlp失败: ${err.message}`));
      });
    });
  }

  async _processSubtitleFiles(timestamp) {
    const files = fs.readdirSync(this.tempDir);
    const subtitleFiles = files.filter(
      (f) =>
        f.startsWith(`subs_${timestamp}`) &&
        (f.endsWith(".json3") ||
          f.endsWith(".vtt") ||
          f.endsWith(".srt") ||
          f.endsWith(".ass")),
    );

    if (subtitleFiles.length === 0) {
      throw new Error("未找到字幕文件");
    }

    const subtitleData = [];

    for (const file of subtitleFiles) {
      const filePath = path.join(this.tempDir, file);
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const ext = path.extname(file).toLowerCase();
        const result = this._parseSubtitle(content, ext);

        if (result.text && result.text.length > 0) {
          subtitleData.push({
            file: file,
            format: ext.slice(1),
            text: result.text,
            segments: result.segments || [],
          });
        }
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn(`[SubtitleExtractor] Failed to process file: ${file}`);
      }
    }

    if (subtitleData.length === 0) {
      throw new Error("无法解析字幕内容");
    }

    subtitleData.sort((a, b) => b.text.length - a.text.length);

    const best = subtitleData[0];
    return {
      success: true,
      text: best.text,
      format: best.format,
      length: best.text.length,
      segments: best.segments,
    };
  }

  _parseSubtitle(content, format) {
    switch (format) {
      case "json3":
        return this._parseJSON3(content);
      case "vtt":
        return this._parseVTT(content);
      case "srt":
        return this._parseSRT(content);
      case "ass":
        return this._parseASS(content);
      default:
        return { text: content, segments: [] };
    }
  }

  _parseJSON3(content) {
    try {
      const json = JSON.parse(content);
      const body = json.body || [];
      const segments = [];
      const texts = [];

      for (const item of body) {
        const text = (item.content || "").trim();
        if (!text) continue;
        segments.push({
          start: Math.round(item.from * 100) / 100,
          end: Math.round(item.to * 100) / 100,
          text: text,
        });
        texts.push(text);
      }

      return { text: texts.join(" "), segments: segments };
    } catch (e) {
      return { text: content, segments: [] };
    }
  }

  _parseVTT(content) {
    const lines = content.split("\n");
    const textLines = [];
    const segments = [];
    const timePattern =
      /^(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/;
    let currentSegment = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (
        line === "" ||
        line.startsWith("WEBVTT") ||
        line.startsWith("NOTE") ||
        line.startsWith("Kind:") ||
        line.startsWith("Language:")
      ) {
        if (currentSegment && currentSegment.text) {
          segments.push(currentSegment);
        }
        currentSegment = null;
        continue;
      }

      const timeMatch = line.match(timePattern);
      if (timeMatch) {
        if (currentSegment && currentSegment.text) {
          segments.push(currentSegment);
        }
        currentSegment = {
          start: this._timeToSeconds(timeMatch[1]),
          end: this._timeToSeconds(timeMatch[2]),
          text: "",
        };
        continue;
      }

      if (currentSegment) {
        const cleanText = line.replace(/<[^>]+>/g, "").trim();
        if (cleanText) {
          currentSegment.text += (currentSegment.text ? " " : "") + cleanText;
        }
      } else if (line && !line.match(/^\d+$/)) {
        textLines.push(line);
      }
    }

    if (currentSegment && currentSegment.text) {
      segments.push(currentSegment);
    }

    const allTexts =
      segments.length > 0 ? segments.map((s) => s.text) : textLines;
    return { text: allTexts.join(" "), segments: segments };
  }

  _timeToSeconds(timeStr) {
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return Math.round((hours * 3600 + minutes * 60 + seconds) * 100) / 100;
  }

  _parseSRT(content) {
    const lines = content.split("\n");
    const textLines = [];
    const segments = [];
    let currentSegment = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === "") {
        if (currentSegment && currentSegment.text) {
          segments.push(currentSegment);
        }
        currentSegment = null;
        continue;
      }

      if (line.match(/^\d+$/) && !currentSegment) {
        currentSegment = { start: 0, end: 0, text: "" };
        continue;
      }

      if (line.includes("-->") && currentSegment) {
        const times = line.split("-->");
        if (times.length === 2) {
          currentSegment.start = this._parseSRTTime(times[0].trim());
          currentSegment.end = this._parseSRTTime(times[1].trim());
        }
        continue;
      }

      if (currentSegment) {
        currentSegment.text += (currentSegment.text ? " " : "") + line;
      }
    }

    if (currentSegment && currentSegment.text) {
      segments.push(currentSegment);
    }

    const allTexts =
      segments.length > 0 ? segments.map((s) => s.text) : textLines;
    return { text: allTexts.join(" "), segments: segments };
  }

  _parseSRTTime(timeStr) {
    const parts = timeStr.split(",");
    const mainParts = parts[0].split(":");
    const hours = parseInt(mainParts[0], 10);
    const minutes = parseInt(mainParts[1], 10);
    const seconds = parseFloat(mainParts[2] + "." + (parts[1] || "0"));
    return Math.round((hours * 3600 + minutes * 60 + seconds) * 100) / 100;
  }

  _parseASS(content) {
    const lines = content.split("\n");
    const textLines = [];
    let inDialogue = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith("[Events]")) {
        inDialogue = true;
        continue;
      }

      if (inDialogue && line.startsWith("Dialogue:")) {
        const parts = line.split(",");
        if (parts.length > 9) {
          const text = parts.slice(9).join(",").trim();
          if (text && !text.startsWith("{") && text.length > 0) {
            textLines.push(text.replace(/\{[^}]+\}/g, ""));
          }
        }
      }
    }

    return { text: textLines.join("\n"), segments: [] };
  }

  _cleanError(errorOutput) {
    if (!errorOutput) return null;

    const lines = errorOutput.split("\n");
    const relevantLines = lines.filter(
      (line) =>
        line.includes("ERROR") ||
        line.includes("error") ||
        line.includes("Error"),
    );

    return relevantLines.slice(-3).join("\n").trim();
  }

  async getVideoInfo(url) {
    return new Promise((resolve, reject) => {
      const args = ["-J", "--no-warnings", "--skip-download", url];
      const ytdlp = spawn("yt-dlp", args, { timeout: 30000 });

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
          reject(new Error("获取视频信息超时"));
          return;
        }

        if (code === 0) {
          try {
            const info = JSON.parse(output);
            resolve({
              id: info.id || "",
              title: info.title || "Unknown Title",
              duration: this._formatDuration(info.duration),
              thumbnail: info.thumbnail || "",
              webpageUrl: info.webpage_url || url,
            });
          } catch (e) {
            reject(new Error("解析视频信息失败"));
          }
        } else {
          reject(
            new Error(
              `获取视频信息失败: ${this._cleanError(errorOutput) || "Unknown error"}`,
            ),
          );
        }
      });

      ytdlp.on("error", (err) => {
        clearTimeout(timeoutId);
        reject(new Error(`启动yt-dlp失败: ${err.message}`));
      });
    });
  }

  _formatDuration(seconds) {
    if (!seconds || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
}
