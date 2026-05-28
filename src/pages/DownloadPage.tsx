import { useState, useEffect } from "react";
import {
  Download,
  Play,
  Clock,
  Files,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  ExternalLink,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { VideoInfo, VideoFormat } from "../types";
import { getVideoInfo } from "../api/video";

export default function DownloadPage() {
  const [searchParams] = useSearchParams();
  const [urls, setUrls] = useState<string[]>([""]);
  const [isParsing, setIsParsing] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(
    null,
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadHistory, setDownloadHistory] = useState<VideoInfo[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = searchParams.get("url");
    if (url) {
      setUrls([url]);
    }
  }, [searchParams]);

  const addUrlField = () => {
    if (urls.length < 10) {
      setUrls([...urls, ""]);
    }
  };

  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleParse = async () => {
    const validUrls = urls.filter((u) => u.trim());
    if (validUrls.length === 0) return;

    setIsParsing(true);
    setError(null);

    try {
      const info = await getVideoInfo(validUrls[0]);
      
      if (!info.formats || info.formats.length === 0) {
        throw new Error('该视频暂不支持下载');
      }
      
      setVideoInfo(info);
      setSelectedFormat(info.formats[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取视频信息失败");
      console.error("Parse error:", err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedFormat || !videoInfo) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadUrl(null);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: videoInfo.url,
          format: selectedFormat.ext,
          quality: selectedFormat.resolution,
        }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法获取响应流");
      }

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        while (buffer.includes("\n\n")) {
          const lineEnd = buffer.indexOf("\n\n");
          const eventData = buffer.substring(0, lineEnd);
          buffer = buffer.substring(lineEnd + 2);

          if (eventData.startsWith("data: ")) {
            const jsonStr = eventData.substring(6).trim();
            
            if (jsonStr && jsonStr.startsWith("{")) {
              try {
                const progress = JSON.parse(jsonStr);

                if (progress.status === "downloading" || progress.status === "processing") {
                  setDownloadProgress(progress.progress);
                } else if (progress.status === "completed") {
                  setDownloadProgress(100);
                  const fullUrl = `http://localhost:3001${progress.downloadUrl}`;
                  setDownloadUrl(fullUrl);

                  if (videoInfo) {
                    setDownloadHistory([videoInfo, ...downloadHistory]);
                  }

                  setTimeout(() => {
                    const link = document.createElement("a");
                    link.href = fullUrl;
                    link.download = progress.fileName || "video.mp4";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }, 500);
                } else if (progress.status === "error") {
                  setError(progress.error || "下载失败");
                }
              } catch (e) {
                console.error("JSON解析失败:", jsonStr, e);
              }
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "下载失败";
      setError(errorMessage);
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDirectDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            视频下载中心
          </h1>
          <p className="text-gray-400">粘贴视频链接，选择画质，一键下载</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            视频链接
          </h2>
          <div className="space-y-3">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder="粘贴视频链接..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-primary-400"
                />
                {urls.length > 1 && (
                  <button
                    onClick={() => removeUrlField(index)}
                    className="w-12 h-12 rounded-xl bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-red-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {urls.length < 10 && (
            <button
              onClick={addUrlField}
              className="mt-4 flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
            >
              <Plus className="w-5 h-5" />
              添加更多链接
            </button>
          )}

          <button
            onClick={handleParse}
            disabled={isParsing || urls.every((u) => !u.trim())}
            className="mt-6 w-full btn-primary flex items-center justify-center gap-2"
          >
            {isParsing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                正在解析...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                解析视频
              </>
            )}
          </button>
        </div>

        {videoInfo && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-full md:w-48 h-32 md:h-auto object-cover rounded-xl"
              />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-2">
                  {videoInfo.title}
                </h3>
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {videoInfo.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Files className="w-4 h-4" />
                    {selectedFormat?.size}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <ChevronDown className="w-5 h-5" />
                选择格式和画质
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {videoInfo.formats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format)}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedFormat?.id === format.id
                        ? "border-primary-500 bg-primary-500/20"
                        : "border-white/20 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-white font-semibold">
                      {format.resolution}
                    </div>
                    <div className="text-gray-400 text-sm">{format.size}</div>
                    <div className="text-gray-500 text-xs uppercase">
                      {format.ext}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {downloadUrl ? (
              <button
                onClick={handleDirectDownload}
                className="mt-6 w-full btn-primary flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                点击下载
              </button>
            ) : (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="mt-6 w-full btn-primary flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    下载中 {Math.round(downloadProgress)}%
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    立即下载
                  </>
                )}
              </button>
            )}

            {isDownloading && (
              <div className="mt-4">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {downloadHistory.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h4 className="text-white font-semibold mb-4">下载历史</h4>
            <div className="space-y-3">
              {downloadHistory.map((video, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-xl"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-16 h-9 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium truncate">
                      {video.title}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-yellow-200 text-sm">
              <p className="font-medium mb-1">注意事项</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                <li>请确保你有权下载该视频内容</li>
                <li>请遵守相关平台的使用条款</li>
                <li>我们不会保存你的下载记录</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
