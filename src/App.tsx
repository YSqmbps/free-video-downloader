import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DownloadPage from './pages/DownloadPage';
import PricingPage from './pages/PricingPage';
import GuidePage from './pages/GuidePage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
