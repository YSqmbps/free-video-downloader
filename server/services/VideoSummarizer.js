import { OpenAI } from "openai";
import dotenv from "dotenv";
import { SubtitleExtractor } from "./SubtitleExtractor.js";

dotenv.config();

export class VideoSummarizer {
  constructor() {
    const provider = process.env.AI_PROVIDER || "deepseek";

    if (provider === "deepseek") {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY 环境变量未设置");
      }

      this.openai = new OpenAI({
        apiKey: apiKey,
        baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com",
      });
      this.model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
    }

    this.subtitleExtractor = new SubtitleExtractor();
  }

  async summarize(url, options = {}) {
    const {
      mode = "detailed",
      includeOutline = true,
      includeKeyPoints = true,
      includeContent = true,
    } = options;

    try {
      console.log(`[VideoSummarizer] Starting summary for: ${url}`);

      const videoInfo = await this.subtitleExtractor.getVideoInfo(url);
      console.log(`[VideoSummarizer] Got video info: ${videoInfo.title}`);

      const subtitleResult = await this.subtitleExtractor.extract(url);
      console.log(
        `[VideoSummarizer] Subtitle extracted, length: ${subtitleResult.text.length}`,
      );

      if (!subtitleResult.text || subtitleResult.text.length === 0) {
        throw new Error("无法提取视频字幕，请确保视频有字幕");
      }

      const summary = await this._generateSummary(
        videoInfo,
        subtitleResult.text,
        {
          mode,
          includeOutline,
          includeKeyPoints,
          includeContent,
        },
      );

      return {
        success: true,
        video: videoInfo,
        summary: summary,
      };
    } catch (error) {
      console.error("[VideoSummarizer] Error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async *summarizeStream(url, options = {}) {
    const { mode = "detailed" } = options;

    try {
      yield { status: "info", message: "正在获取视频信息..." };

      const videoInfo = await this.subtitleExtractor.getVideoInfo(url);
      yield { status: "info", message: `视频标题: ${videoInfo.title}` };

      yield { status: "info", message: "正在提取字幕..." };
      const subtitleResult = await this.subtitleExtractor.extract(url);
      yield {
        status: "info",
        message: `字幕提取完成，共 ${subtitleResult.text.length} 字符`,
      };

      if (!subtitleResult.text || subtitleResult.text.length === 0) {
        yield {
          status: "error",
          message: "无法提取视频字幕，请确保视频有字幕",
        };
        return;
      }

      yield { status: "info", message: "正在生成总结..." };

      const language = subtitleResult.language || "zh";
      const fullText = subtitleResult.text;

      for await (const token of this._generateSummaryStream(
        fullText,
        language,
      )) {
        yield { status: "summary", content: token };
      }

      yield { status: "info", message: "正在生成思维导图..." };
      const mindmap = await this.generateMindmap(fullText, language);
      yield { status: "mindmap", markdown: mindmap };

      yield { status: "done" };
    } catch (error) {
      console.error("[VideoSummarizer] Stream Error:", error.message);
      yield { status: "error", message: error.message };
    }
  }

  async *chatStream(subtitleText, question) {
    try {
      const prompt = this._buildChatPrompt(subtitleText, question);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "你是一个视频内容问答助手。根据提供的视频字幕内容来回答用户的问题。如果问题超出视频内容范围，请诚实告知。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      });

      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield delta.content;
        }
      }
    } catch (error) {
      console.error("[VideoSummarizer] Chat Error:", error.message);
      throw error;
    }
  }

  async generateMindmap(subtitleText, language = "zh") {
    const prompt = this._buildMindmapPrompt(subtitleText, language);

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的思维导图生成助手，擅长将内容组织为清晰的层级结构。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
      temperature: 0.5,
      max_tokens: 4096,
    });

    return response.choices[0]?.message?.content || "";
  }

  async _generateSummary(videoInfo, subtitles, options) {
    const { mode, includeOutline, includeKeyPoints, includeContent } = options;

    const prompt = this._buildSummaryPrompt(videoInfo, subtitles, mode, {
      includeOutline,
      includeKeyPoints,
      includeContent,
    });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "你是一位专业的视频内容分析助手，擅长总结视频内容、提取核心要点和生成大纲。请用中文回复。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const result = response.choices[0]?.message?.content;

    if (!result) {
      throw new Error("未能生成总结内容");
    }

    return this._parseSummaryResult(result, mode);
  }

  async *_generateSummaryStream(subtitleText, language = "zh") {
    const prompt = this._buildSummaryPromptText(subtitleText, language);

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的视频内容分析助手，擅长提取关键信息并生成结构化的总结。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    });

    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield delta.content;
      }
    }
  }

  _buildSummaryPromptText(subtitleText, language) {
    const truncated = subtitleText.substring(0, 15000);
    const langHint = language.startsWith("zh") ? "中文" : "与原文相同的语言";

    return `请对以下视频字幕内容进行深度总结分析，使用${langHint}输出。

要求输出格式：
## 视频概述
（用2-3句话概括视频的主题和核心内容）

## 内容大纲
（按视频内容的逻辑顺序，列出主要章节/段落，每个章节包含要点）

## 核心知识要点
（提取视频中最重要的知识点、观点或结论，用编号列表形式）

## 总结
（用1-2句话给出整体评价或一句话总结）

---
视频字幕内容：
${truncated}`;
  }

  _buildSummaryPrompt(videoInfo, subtitles, mode, options) {
    const { includeOutline, includeKeyPoints, includeContent } = options;

    const modeInstructions = {
      brief: "请用简洁的语言总结视频内容，不超过300字。",
      detailed: "请详细总结视频内容，包括主要观点、关键数据和结论。",
      outline: "请为视频生成结构化的大纲，包括主要章节和子主题。",
      keyPoints: "请提取视频的核心要点和关键信息。",
    };

    let formatInstructions = "";
    if (includeOutline)
      formatInstructions += "1. 视频大纲：列出视频的主要章节和子主题\n";
    if (includeKeyPoints)
      formatInstructions += "2. 核心要点：总结视频的关键内容和重要数据\n";
    if (includeContent) formatInstructions += "3. 总结内容：详细的视频总结\n";

    return `
视频标题：${videoInfo.title}
视频时长：${videoInfo.duration}

${modeInstructions[mode] || modeInstructions.detailed}

视频字幕内容：
${subtitles.substring(0, 10000)}

请按照以下格式输出：
${formatInstructions}

请用中文回复。
    `.trim();
  }

  _buildMindmapPrompt(subtitleText, language) {
    const truncated = subtitleText.substring(0, 15000);
    const langHint = language.startsWith("zh") ? "中文" : "与原文相同的语言";

    return `请将以下视频字幕内容整理为思维导图结构，使用${langHint}输出。

要求：
1. 使用 Markdown 标题层级格式（# 一级标题，## 二级标题，### 三级标题）
2. 最外层是视频主题
3. 第二层是主要章节/模块
4. 第三层是各章节的要点
5. 可以有第四层做更细的展开
6. 每个节点的文字要简洁精炼
7. 只输出 Markdown 内容，不要其他说明文字

---
视频字幕内容：
${truncated}`;
  }

  _buildChatPrompt(subtitleText, question) {
    const truncated = subtitleText.substring(0, 12000);

    return `以下是一个视频的字幕内容，请根据这些内容回答用户的问题。

视频字幕内容：
${truncated}

---
用户问题：${question}

请基于视频内容给出准确、详细的回答。如果视频内容中没有相关信息，请诚实说明。`;
  }

  _parseSummaryResult(result, mode) {
    const outlineMatch = result.match(/1\.\s*视频大纲：([\s\S]*?)(?=\n2\.|$)/);
    const keyPointsMatch = result.match(
      /2\.\s*核心要点：([\s\S]*?)(?=\n3\.|$)/,
    );
    const contentMatch = result.match(/3\.\s*总结内容：([\s\S]*)/);

    const outline = outlineMatch
      ? outlineMatch[1]
          .trim()
          .split("\n")
          .filter((l) => l.trim())
      : [];

    const keyPoints = keyPointsMatch
      ? keyPointsMatch[1]
          .trim()
          .split("\n")
          .filter((l) => l.trim())
      : [];

    return {
      outline: outline,
      keyPoints: keyPoints,
      content: contentMatch ? contentMatch[1].trim() : result,
      raw: result,
      mode: mode,
    };
  }
}
