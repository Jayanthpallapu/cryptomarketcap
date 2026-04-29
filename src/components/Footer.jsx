import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand-name">CryptoMarketCap</div>
            <p className="brand-desc">
              The world's most-referenced price-tracking website for cryptoassets.
              Our mission is to make crypto discoverable and efficient globally by
              empowering users with unbiased, high quality and accurate information.
            </p>
            <div className="footer-socials">
              <a href="#" title="Twitter">𝕏</a>
              <a href="#" title="Telegram">✈</a>
              <a href="#" title="Reddit">⊕</a>
              <a href="#" title="Instagram">📷</a>
              <a href="#" title="Facebook">f</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Products</h4>
            <Link to="/">Blockchain Explorer</Link>
            <Link to="/">Crypto API</Link>
            <Link to="/">Site Widgets</Link>
            <Link to="/">Newsletter</Link>
            <a href="#">Advertise</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Terms of Use</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Methodology</a>
            <a href="#">Careers <span className="hiring-badge">HIRING</span></a>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <a href="#">Request Form</a>
            <a href="#">Contact Support</a>
            <a href="#">FAQ</a>
            <a href="#">Glossary</a>
            <a href="#">Get Listed</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2024 CryptoMarketCap. All rights reserved.</span>
          <span>Data powered by CoinGecko API</span>
        </div>
      </div>
    </footer>
  )
}
