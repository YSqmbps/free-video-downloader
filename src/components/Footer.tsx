import { Download, Github, Twitter, Mail, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-primary p-2 rounded-xl">
                <Download className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">视频下载器</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              从任何网站下载高清视频，支持1000+主流平台，让精彩内容触手可及。
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">快速链接</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link to="/download" className="hover:text-white transition-colors">
                  下载中心
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  会员订阅
                </Link>
              </li>
              <li>
                <Link to="/guide" className="hover:text-white transition-colors">
                  使用教程
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">支持平台</h3>
            <ul className="space-y-3">
              <li className="hover:text-white transition-colors cursor-pointer">
                YouTube
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                Bilibili
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                抖音 / TikTok
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                快手
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                更多平台
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">帮助与支持</h3>
            <ul className="space-y-3">
              <li className="hover:text-white transition-colors cursor-pointer">
                常见问题
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                联系客服
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                隐私政策
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                服务条款
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            2024 万能视频下载器. 保留所有权利.
          </p>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            用 <Heart className="w-4 h-4 text-red-500" /> 打造
          </p>
        </div>
      </div>
    </footer>
  );
}
