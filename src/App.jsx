import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GlobalStatsBar from './components/GlobalStatsBar'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CoinDetailPage from './pages/CoinDetailPage'
import ExchangesPage from './pages/ExchangesPage'
import TrendingPage from './pages/TrendingPage'
import WatchlistPage from './pages/WatchlistPage'
import GainersLosersPage from './pages/GainersLosersPage'
import NewCoinsPage from './pages/NewCoinsPage'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ backgroundColor: '#ea3943', color: 'white', padding: '10px 0', fontWeight: 'bold', fontSize: '15px', borderBottom: '2px solid #b91c1c' }}>
        <marquee behavior="scroll" direction="left" scrollamount="8">
          OSRO Coin Database has been hacked in the quantum fake price hiking with the fake money please ignore the price and the actuall price is now reflecting
        </marquee>
      </div>
      <GlobalStatsBar />
      <Navbar />
      <main style={{ minHeight: '60vh' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/coin/:id" element={<CoinDetailPage />} />
          <Route path="/exchanges" element={<ExchangesPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/gainers-losers" element={<GainersLosersPage />} />
          <Route path="/new" element={<NewCoinsPage />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}
