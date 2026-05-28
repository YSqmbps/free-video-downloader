import { Download, Shield, Globe, Heart, Star } from 'lucide-react';

const stats = [
  { value: '1000+', label: '支持平台' },
  { value: '100万+', label: '下载次数' },
  { value: '99.9%', label: '服务可用性' },
  { value: '24/7', label: '全天候服务' },
];

const team = [
  { name: '张三', role: '创始人', desc: '10年互联网开发经验' },
  { name: '李四', role: '技术总监', desc: '专注于视频技术研究' },
  { name: '王五', role: '产品经理', desc: '用户体验专家' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-primary-100 text-primary-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            关于我们
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            万能视频下载器
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            我们致力于为用户提供最便捷的视频下载服务，让精彩内容触手可及
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              我们的使命
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              在数字化时代，视频已经成为人们获取信息和娱乐的主要方式。
              然而，许多精彩的视频内容受到平台限制，无法随时离线观看。
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">
              我们的使命是打破这些限制，让用户能够自由地获取和保存他们喜爱的视频内容。
              通过使用先进的技术，我们支持从1000+主流平台下载视频，
              让精彩内容触手可及。
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-full">
                <Heart className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-primary-700">用户至上</span>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700">安全可靠</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-700">全球服务</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-8 text-white">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Download className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold mb-4">为什么选择我们？</h3>
            <ul className="space-y-4">
              {[
                '支持1000+主流视频平台',
                '支持4K/8K超清画质',
                '支持批量下载',
                '支持多种格式转换',
                '移动端完美适配',
                '安全可靠的服务',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            团队成员
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900">{member.name}</h3>
                <p className="text-primary-600 text-sm font-medium">{member.role}</p>
                <p className="text-gray-500 text-sm mt-1">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
