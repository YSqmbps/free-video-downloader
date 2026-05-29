import { useState } from 'react';
import {
  Play,
  BookOpen,
  List,
  Lightbulb,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { VideoSummary, SummaryMode, getVideoSummary } from '../api/video';

const modeOptions: { value: SummaryMode; label: string; description: string }[] = [
  { value: 'brief', label: '简洁', description: '快速了解视频核心内容' },
  { value: 'detailed', label: '详细', description: '全面深入的内容总结' },
  { value: 'outline', label: '大纲', description: '结构化章节大纲' },
];

export default function SummaryPage() {
  const [url, setUrl] = useState('');
  const [selectedMode, setSelectedMode] = useState<SummaryMode>('detailed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError('请输入视频链接');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSummary(null);

    try {
      const result = await getVideoSummary(url.trim(), selectedMode);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成总结失败');
      console.error('Summary error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            AI 视频总结
          </h1>
          <p className="text-gray-400">
            输入视频链接，AI帮您快速总结视频核心要点
          </p>
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
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3">
              视频链接
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="粘贴视频链接..."
              className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 text-lg"
            />
          </div>

          <div className="mb-8">
            <label className="block text-white font-semibold mb-3">
              总结模式
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedMode(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedMode === option.value
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-white font-semibold">{option.label}</div>
                  <div className="text-gray-400 text-sm mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !url.trim()}
            className="w-full btn-primary flex items-center justify-center gap-2 text-lg py-4"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI 正在分析视频...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                生成总结
              </>
            )}
          </button>
        </div>

        {summary && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-shrink-0">
                  {summary.thumbnail ? (
                    <img
                      src={summary.thumbnail}
                      alt={summary.title}
                      className="w-full md:w-48 h-32 md:h-auto object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full md:w-48 h-32 bg-white/10 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-lg">
                    <span className="text-white text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {summary.duration}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-white font-semibold text-xl mb-2">
                    {summary.title}
                  </h2>
                  <p className="text-gray-400">
                    视频总结已生成，共 {summary.outline.length} 个章节，
                    {summary.keyPoints.length} 个核心要点
                  </p>
                </div>
              </div>
            </div>

            {summary.outline.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <List className="w-5 h-5 text-primary-400" />
                  视频大纲
                </h3>
                <div className="space-y-3">
                  {summary.outline.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-primary-500/20 text-primary-400 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.keyPoints.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  核心要点
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {summary.keyPoints.map((point, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-lg border border-yellow-500/20"
                    >
                      <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.content && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary-400" />
                  详细总结
                </h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {summary.content}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-yellow-200 text-sm">
              <p className="font-medium mb-1">注意事项</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                <li>视频总结基于字幕内容生成，请确保视频有字幕</li>
                <li>总结内容仅供参考，建议观看原视频获取完整信息</li>
                <li>支持 YouTube、B站、抖音、快手等主流平台</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
