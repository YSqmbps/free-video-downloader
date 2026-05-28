import { Copy, ClipboardList, Download, CheckCircle, Smartphone, Laptop } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: '复制视频链接',
    description: '在视频平台找到您想要下载的视频，复制视频页面的URL链接',
    icon: Copy,
  },
  {
    number: '02',
    title: '粘贴到输入框',
    description: '回到我们的网站，将复制的链接粘贴到下载页面的输入框中',
    icon: ClipboardList,
  },
  {
    number: '03',
    title: '选择画质格式',
    description: '点击解析按钮，选择您想要的视频画质和格式（MP4/MP3等）',
    icon: Download,
  },
  {
    number: '04',
    title: '开始下载',
    description: '点击下载按钮，视频将自动保存到您的设备中',
    icon: CheckCircle,
  },
];

const tips = [
  {
    title: '支持的平台',
    content: '我们支持YouTube、B站、抖音、快手、TikTok、Vimeo等1000+主流视频平台',
  },
  {
    title: '批量下载',
    content: '高级用户可以添加多个视频链接进行批量下载，节省时间',
  },
  {
    title: '格式转换',
    content: '支持将视频转换为MP3音频格式，方便提取背景音乐',
  },
  {
    title: '移动端使用',
    content: '网站完美适配手机和平板，随时随地下载视频',
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-primary-100 text-primary-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            使用教程
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            如何下载视频
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            只需简单四步，即可从任何网站下载高清视频
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="text-5xl font-bold text-primary-100 mb-4">
                  {step.number}
                </div>
                <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {step.description}
                </p>
              </div>
              {step.number !== '04' && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-primary-300 to-transparent" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Laptop className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">电脑端使用</h3>
                <p className="text-gray-500 text-sm">适合桌面用户</p>
              </div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                打开浏览器访问我们的网站
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                复制视频链接并粘贴到输入框
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                选择画质后点击下载
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                视频将保存到默认下载目录
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">移动端使用</h3>
                <p className="text-gray-500 text-sm">随时随地下载</p>
              </div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                在浏览器中打开我们的网站
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                从视频APP分享链接到浏览器
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                粘贴链接并选择画质
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                视频将保存到相册或下载文件夹
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            常见问题解答
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-2">{tip.title}</h3>
                <p className="text-gray-400 text-sm">{tip.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
