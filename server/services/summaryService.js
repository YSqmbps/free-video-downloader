import { spawn } from 'child_process';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export async function getVideoSummary(url, mode = 'detailed') {
  try {
    const videoInfo = await extractVideoInfo(url);
    const subtitles = await extractSubtitles(url);
    
    if (!subtitles || subtitles.length === 0) {
      throw new Error('无法提取视频字幕，请确保视频有字幕');
    }
    
    const summary = await generateSummary(videoInfo, subtitles, mode);
    
    return {
      success: true,
      summary: {
        title: videoInfo.title || 'Unknown Title',
        duration: videoInfo.duration || '0:00',
        thumbnail: videoInfo.thumbnail || '',
        ...summary,
      },
    };
  } catch (error) {
    console.error('[Summary Service] Error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function extractVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const args = ['-J', '--no-warnings', '--skip-download', url];
    const ytdlp = spawn('yt-dlp', args, { timeout: 30000 });
    
    let output = '';
    let errorOutput = '';
    let timeout = false;
    
    const timeoutId = setTimeout(() => {
      timeout = true;
      ytdlp.kill();
    }, 30000);
    
    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    ytdlp.on('close', (code) => {
      clearTimeout(timeoutId);
      
      if (timeout) {
        reject(new Error('获取视频信息超时'));
        return;
      }
      
      if (code === 0) {
        try {
          const info = JSON.parse(output);
          resolve({
            title: info.title,
            duration: formatDuration(info.duration),
            thumbnail: info.thumbnail || '',
          });
        } catch (e) {
          reject(new Error('解析视频信息失败'));
        }
      } else {
        reject(new Error(`获取视频信息失败: ${errorOutput || 'Unknown error'}`));
      }
    });
    
    ytdlp.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(new Error(`启动yt-dlp失败: ${err.message}`));
    });
  });
}

async function extractSubtitles(url) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(tempDir, `subs_${Date.now()}.vtt`);
    const args = [
      '--write-auto-sub',
      '--sub-lang', 'zh-Hans,zh,en',
      '--skip-download',
      '-o', tempFile,
      url,
    ];
    
    const ytdlp = spawn('yt-dlp', args, { timeout: 60000 });
    
    let errorOutput = '';
    let timeout = false;
    
    const timeoutId = setTimeout(() => {
      timeout = true;
      ytdlp.kill();
    }, 60000);
    
    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    ytdlp.on('close', (code) => {
      clearTimeout(timeoutId);
      
      if (timeout) {
        reject(new Error('提取字幕超时'));
        return;
      }
      
      if (code === 0) {
        const vttFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.vtt'));
        
        if (vttFiles.length > 0) {
          const latestFile = vttFiles.sort((a, b) => 
            fs.statSync(path.join(tempDir, b)).mtime.getTime() - 
            fs.statSync(path.join(tempDir, a)).mtime.getTime()
          )[0];
          
          const filePath = path.join(tempDir, latestFile);
          
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const text = parseVTT(content);
            
            vttFiles.forEach(f => {
              try {
                fs.unlinkSync(path.join(tempDir, f));
              } catch (e) {
                console.warn(`Failed to delete temp file: ${f}`);
              }
            });
            
            resolve(text);
          } catch (e) {
            reject(new Error('读取字幕文件失败'));
          }
        } else {
          reject(new Error('未找到字幕文件'));
        }
      } else {
        reject(new Error(`提取字幕失败: ${errorOutput || 'Unknown error'}`));
      }
    });
    
    ytdlp.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(new Error(`启动yt-dlp失败: ${err.message}`));
    });
  });
}

function parseVTT(content) {
  const lines = content.split('\n');
  const textLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '' || 
        line.startsWith('WEBVTT') || 
        line.includes('-->') ||
        line.match(/^\d+$/) ||
        line.startsWith('NOTE')) {
      continue;
    }
    
    textLines.push(line);
  }
  
  return textLines.join('\n');
}

async function generateSummary(videoInfo, subtitles, mode) {
  const prompt = buildPrompt(videoInfo, subtitles, mode);
  
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的视频内容分析助手，擅长总结视频内容、提取核心要点和生成大纲。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const result = response.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error('未能生成总结内容');
    }
    
    return parseSummaryResult(result);
  } catch (error) {
    console.error('[OpenAI] Error:', error.message);
    throw new Error(`调用AI服务失败: ${error.message}`);
  }
}

function buildPrompt(videoInfo, subtitles, mode) {
  const modeInstructions = {
    brief: '请用简洁的语言总结视频内容，不超过200字。',
    detailed: '请详细总结视频内容，包括主要观点、关键数据和结论。',
    outline: '请为视频生成结构化的大纲，包括主要章节和子主题。',
  };
  
  return `
视频标题：${videoInfo.title}
视频时长：${videoInfo.duration}
视频字幕：
${subtitles.substring(0, 8000)}

${modeInstructions[mode] || modeInstructions.detailed}

请按照以下格式输出：
1. 视频大纲：列出视频的主要部分
2. 核心要点：总结视频的关键内容
3. 总结内容：详细的视频总结

请用中文回复。
  `.trim();
}

function parseSummaryResult(result) {
  const outlineMatch = result.match(/1\.\s*视频大纲：([\s\S]*?)(?=\n2\.|$)/);
  const keyPointsMatch = result.match(/2\.\s*核心要点：([\s\S]*?)(?=\n3\.|$)/);
  const contentMatch = result.match(/3\.\s*总结内容：([\s\S]*)/);
  
  const outline = outlineMatch 
    ? outlineMatch[1].trim().split('\n').filter(l => l.trim())
    : [];
  
  const keyPoints = keyPointsMatch
    ? keyPointsMatch[1].trim().split('\n').filter(l => l.trim())
    : [];
  
  return {
    outline: outline,
    keyPoints: keyPoints,
    content: contentMatch ? contentMatch[1].trim() : result,
  };
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
