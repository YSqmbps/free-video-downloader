import {
  Download,
  Globe,
  Video,
  Languages,
  Layers,
  Smartphone,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { features } from "../data/platforms";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  download: Download,
  globe: Globe,
  quality: Video,
  translate: Languages,
  batch: Layers,
  mobile: Smartphone,
  summary: Sparkles,
  chat: MessageSquare,
};

export default function Features() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-primary-100 text-primary-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            核心功能
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            为什么选择我们
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            我们提供最全面的视频下载解决方案，让你轻松获取任何平台的视频资源
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon];
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 card-hover border border-gray-100"
              >
                <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  {Icon && <Icon className="w-7 h-7 text-white" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
