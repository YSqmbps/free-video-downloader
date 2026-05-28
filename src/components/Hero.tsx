import { useState } from 'react';
import { Download, Sparkles, ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      setIsProcessing(true);
      setTimeout(() => {
        navigate(`/download?url=${encodeURIComponent(url)}`);
      }, 500);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">支持1000+视频平台</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            万能视频下载器
            <span className="block text-gradient mt-2">一键保存精彩内容</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            从任何网站下载高清视频，支持YouTube、B站、抖音、快手等平台。
            <br className="hidden sm:block" />
            支持4K/8K超清画质，随时随地离线观看。
          </p>

          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="粘贴视频链接..."
                  className="w-full px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
                  disabled={isProcessing}
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing || !url.trim()}
                className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    立即下载
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>服务器运行中</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span>今日已服务 10,000+ 用户</span>
            </div>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/60">
            <span className="text-sm font-medium">受到以下平台用户信赖</span>
            <div className="flex items-center gap-6">
              {['YouTube', 'Bilibili', '抖音', 'TikTok'].map((platform) => (
                <span
                  key={platform}
                  className="text-lg font-semibold text-white/80"
                >
                  {platform}
                </span>
              ))}
            </div>
            <ArrowRight className="w-5 h-5 text-primary-400" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
