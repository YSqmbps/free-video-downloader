import { platforms } from '../data/platforms';

export default function Platforms() {
  return (
    <section className="py-20 md:py-32 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            支持平台
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            覆盖全球主流平台
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            无论你想下载哪个平台的视频，我们都能帮你搞定
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {platforms.map((platform, index) => (
            <div
              key={index}
              className="bg-white/5 hover:bg-white/10 rounded-xl p-6 text-center transition-all duration-300 cursor-pointer group"
            >
              <div className="text-2xl md:text-3xl font-bold text-white/80 group-hover:text-white transition-colors">
                {platform.name.charAt(0)}
              </div>
              <div className="mt-2 text-sm text-gray-400 group-hover:text-white/80 transition-colors">
                {platform.name}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            还有更多平台支持中...
          </p>
        </div>
      </div>
    </section>
  );
}
