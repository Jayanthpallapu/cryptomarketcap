import CoinTable from '../components/CoinTable'

export default function HomePage() {
  return (
    <div style={{ paddingTop: '40px' }}>
      <section className="container">
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px' }}>
          Today's Cryptocurrency Prices by Market Cap
        </h1>
        <CoinTable />
      </section>
    </div>
  )
}
