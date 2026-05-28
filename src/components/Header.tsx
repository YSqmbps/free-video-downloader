import { useState, useEffect } from 'react';
import { Download, Menu, X, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: '首页', href: '/' },
    { name: '下载', href: '/download' },
    { name: '会员', href: '/pricing' },
    { name: '教程', href: '/guide' },
    { name: '关于', href: '/about' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-primary p-2 rounded-xl">
              <Download className="w-6 h-6 text-white" />
            </div>
            <span
              className={`text-xl font-bold ${
                isScrolled ? 'text-gray-900' : 'text-white'
              }`}
            >
              视频下载器
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`font-medium transition-colors hover:text-primary-500 ${
                  location.pathname === link.href
                    ? 'text-primary-600'
                    : isScrolled
                    ? 'text-gray-600'
                    : 'text-white/90'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/download"
              className="btn-primary flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              立即下载
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X
                className={`w-6 h-6 ${isScrolled ? 'text-gray-900' : 'text-white'}`}
              />
            ) : (
              <Menu
                className={`w-6 h-6 ${isScrolled ? 'text-gray-900' : 'text-white'}`}
              />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white rounded-2xl shadow-xl mt-2 p-4 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                    location.pathname === link.href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/download"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 btn-primary text-center"
              >
                立即下载
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
