import { useState, useCallback } from "react";
import {
  FileText,
  Lightbulb,
  MessageSquare,
  Loader2,
  AlertCircle,
  Sparkles,
  Play,
} from "lucide-react";
import MindMap from "./MindMap";

interface VideoInfo {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
}

interface SummaryData {
  outline: string[];
  keyPoints: string[];
  content: string;
}

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
}

type TabType = "outline" | "keyPoints" | "content" | "chat";

interface VideoSummaryProps {
  videoUrl: string;
  videoInfo?: VideoInfo;
}

export default function VideoSummary({
  videoUrl,
  videoInfo,
}: VideoSummaryProps) {
  const [activeTab, setActiveTab] = useState<TabType>("outline");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [summaryData, setSummaryData] = useState<SummaryData>({
    outline: [],
    keyPoints: [],
    content: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [hasFetched, setHasFetched] = useState(false);
  const [mindmapData, setMindmapData] = useState<string>("");

  const tabs: { id: TabType; label: string; icon: typeof FileText }[] = [
    { id: "outline", label: "总结摘要", icon: FileText },
    { id: "keyPoints", label: "核心要点", icon: Lightbulb },
    { id: "content", label: "思维导图", icon: FileText },
    { id: "chat", label: "AI对话", icon: MessageSquare },
  ];

  const fetchSummary = useCallback(async () => {
    if (!videoUrl) return;

    setIsLoading(true);
    setError(null);
    setStreamingContent("");
    setSummaryData({ outline: [], keyPoints: [], content: "" });
    setHasFetched(true);

    try {
      console.log("[VideoSummary] Starting fetch...");
      const response = await fetch("http://localhost:3001/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: videoUrl, mode: "detailed" }),
        keepalive: true,
      });

      console.log("[VideoSummary] Response status:", response.status);

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法获取响应流");
      }

      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let fullSummaryContent = "";

      const parseAndUpdateSummary = (content: string) => {
        console.log("[VideoSummary] 开始解析，内容长度:", content.length);
        const sections = content.split(/^## /m);
        console.log("[VideoSummary] 章节数量:", sections.length);

        let overviewText = "";
        let outlineText = "";
        let keyPointsText = "";
        let summaryText = "";

        for (const section of sections) {
          if (section.startsWith("视频概述")) {
            overviewText = section
              .replace(/^视频概述\n*/, "")
              .replace(/^视频概述/, "")
              .trim();
            console.log("[VideoSummary] 找到视频概述");
          } else if (section.startsWith("内容大纲")) {
            outlineText = section
              .replace(/^内容大纲\n*/, "")
              .replace(/^内容大纲/, "")
              .trim();
            console.log("[VideoSummary] 找到内容大纲");
          } else if (section.startsWith("核心知识要点")) {
            keyPointsText = section
              .replace(/^核心知识要点\n*/, "")
              .replace(/^核心知识要点/, "")
              .trim();
            console.log("[VideoSummary] 找到核心知识要点");
          } else if (section.startsWith("总结")) {
            summaryText = section
              .replace(/^总结\n*/, "")
              .replace(/^总结/, "")
              .trim();
            console.log("[VideoSummary] 找到总结");
          }
        }

        const outlineItems = outlineText
          ? outlineText.split("\n").filter((l) => l.trim())
          : [];

        const keyPointItems = keyPointsText
          ? keyPointsText.split("\n").filter((l) => l.trim())
          : [];

        const detailedContent = overviewText
          ? overviewText + "\n\n" + summaryText
          : content;

        console.log("[VideoSummary] 解析结果:", {
          outlineCount: outlineItems.length,
          keyPointCount: keyPointItems.length,
          detailedLength: detailedContent.length,
        });

        setSummaryData({
          outline: outlineItems,
          keyPoints: keyPointItems,
          content: detailedContent,
        });
      };

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

                if (progress.status === "info") {
                  setLoadingMessage(progress.message);
                } else if (progress.status === "summary") {
                  fullSummaryContent += progress.content || "";
                  setStreamingContent(fullSummaryContent);
                } else if (progress.status === "mindmap") {
                  console.log("Received mindmap:", progress.markdown);
                  setMindmapData(progress.markdown || "");
                } else if (progress.status === "done") {
                  console.log("Summary completed，开始解析完整内容");
                  console.log(
                    "完整内容:",
                    fullSummaryContent.substring(0, 200),
                  );
                  parseAndUpdateSummary(fullSummaryContent);
                }
              } catch (e) {
                console.error("JSON解析失败:", jsonStr, e);
              }
            }
          }
        }
      }

      setLoadingMessage("总结生成完成");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "获取总结失败";
      setError(errorMessage);
      console.error("Summary error:", err);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage("");
      }, 500);
    }
  }, [videoUrl, streamingContent]);

  const handleChat = async () => {
    if (!chatMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: "user",
      content: chatMessage,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatMessage("");
    setIsChatting(true);

    try {
      const response = await fetch("http://localhost:3001/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: chatMessage,
          subtitleText: streamingContent || summaryData.content,
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
      let aiResponse = "";
      let aiMessageId = `msg-${Date.now()}-ai`;

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
                if (progress.status === "answer" && progress.content) {
                  aiResponse += progress.content;
                  setChatMessages((prev) => {
                    const existingAiIndex = prev.findIndex(
                      (m) => m.id === aiMessageId,
                    );
                    if (existingAiIndex >= 0) {
                      const updated = [...prev];
                      updated[existingAiIndex] = {
                        ...updated[existingAiIndex],
                        content: aiResponse,
                      };
                      return updated;
                    }
                    return [
                      ...prev,
                      { id: aiMessageId, type: "ai", content: aiResponse },
                    ];
                  });
                }
              } catch (e) {
                console.error("JSON解析失败:", jsonStr, e);
              }
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "对话失败";
      setError(errorMessage);
      console.error("Chat error:", err);
    } finally {
      setIsChatting(false);
    }
  };

  const handleManualSummary = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-6">
      {videoInfo && (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">AI 视频总结</h3>
            <p className="text-gray-400 text-sm truncate max-w-xs">
              {videoInfo.title}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-300 font-medium">{error}</span>
          </div>
          {error.includes("字幕") && (
            <div className="text-gray-400 text-sm ml-8">
              <p>💡 提示：视频总结功能需要视频有字幕支持</p>
              <p className="mt-1">请尝试其他带有字幕的视频，如：</p>
              <ul className="mt-1 list-disc list-inside">
                <li>B站带字幕的视频</li>
                <li>YouTube自动生成字幕的视频</li>
                <li>其他平台带字幕的视频</li>
              </ul>
            </div>
          )}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleManualSummary}
              className="px-4 py-2 bg-primary-500/50 hover:bg-primary-500 rounded-lg text-white text-sm transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 text-primary-400 animate-spin mb-4" />
          <p className="text-white">{loadingMessage || "正在生成总结..."}</p>
          {streamingContent && (
            <div className="mt-4 p-4 bg-white/5 rounded-xl text-gray-300 text-sm max-h-64 overflow-y-auto">
              {streamingContent}
            </div>
          )}
        </div>
      )}

      {!isLoading && !streamingContent && !hasFetched && (
        <div className="flex flex-col items-center justify-center py-12">
          <Sparkles className="w-16 h-16 text-primary-400 mb-4 opacity-50" />
          <p className="text-gray-400 mb-4">点击下方按钮生成视频总结</p>
          <button
            onClick={handleManualSummary}
            className="px-6 py-3 bg-gradient-primary rounded-xl text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            生成总结
          </button>
        </div>
      )}

      {!isLoading && !error && hasFetched && (
        <>
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-all duration-300 ${
                    activeTab === tab.id
                      ? "tab-active text-white shadow-lg"
                      : "tab-inactive text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-[300px]">
            {activeTab === "outline" && (
              <div className="p-6 bg-white/5 rounded-2xl max-h-96 overflow-y-auto border border-white/10 backdrop-blur-sm">
                {streamingContent ? (
                  <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed space-y-4">
                    {streamingContent}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
                      <FileText className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-gray-400">暂无大纲数据</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "keyPoints" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summaryData.keyPoints.length > 0 ? (
                  summaryData.keyPoints.map((point, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                      </div>
                      <span className="text-gray-300 text-sm">{point}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-500 col-span-2">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
                      <Lightbulb className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-gray-400">暂无核心要点</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "content" && <MindMap data={mindmapData} />}

            {activeTab === "chat" && (
              <div className="flex flex-col h-[400px] bg-white/5 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm">
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <div className="w-16 h-16 rounded-full bg-gradient-primary/20 flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-primary-400" />
                      </div>
                      <p className="text-gray-400 font-medium">开始与AI对话</p>
                      <p className="text-sm text-gray-500 mt-1">
                        输入问题并发送
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-4 ${
                          message.type === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`max-w-[75%] px-5 py-3.5 rounded-2xl ${
                            message.type === "user"
                              ? "message-user text-white rounded-tr-md"
                              : "message-ai text-gray-300 rounded-tl-md"
                          }`}
                        >
                          <p className="leading-relaxed text-sm">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {isChatting && (
                    <div className="flex items-start gap-4">
                      <div className="max-w-[75%] px-5 py-3.5 rounded-2xl message-ai text-gray-300 rounded-tl-md">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                          <span className="text-sm">AI正在思考...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-white/10 bg-white/[0.03]">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleChat()}
                      placeholder="输入您的问题..."
                      className="flex-1 px-5 py-3 rounded-xl input-glass text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      disabled={isChatting}
                    />
                    <button
                      onClick={handleChat}
                      disabled={isChatting || !chatMessage.trim()}
                      className="px-6 py-3 bg-gradient-primary hover:opacity-90 disabled:bg-gray-600 disabled:opacity-50 rounded-xl text-white font-medium flex items-center gap-2 transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
                    >
                      {isChatting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      发送
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
