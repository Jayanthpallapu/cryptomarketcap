import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GlobalStatsBar from './components/GlobalStatsBar'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CoinDetailPage from './pages/CoinDetailPage'
import ExchangesPage from './pages/ExchangesPage'
import TrendingPage from './pages/TrendingPage'
import WatchlistPage from './pages/WatchlistPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <GlobalStatsBar />
      <Navbar />
      <main style={{ minHeight: '60vh' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/coin/:id" element={<CoinDetailPage />} />
          <Route path="/exchanges" element={<ExchangesPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}
