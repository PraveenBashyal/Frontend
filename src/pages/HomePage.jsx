import { Link } from 'react-router-dom'
import { useAuth } from '../api/AuthContext'

const FEATURES = [
  {
    icon:  '↗',
    title: 'Track markets',
    text:  'Search stocks, crypto, and ETFs from one simple interface.',
  },
  {
    icon:  '◉',
    title: 'Read sentiment',
    text:  'Understand market mood and follow the information behind price movements.',
  },
  {
    icon:  '☆',
    title: 'Build your watchlist',
    text:  'Save assets you care about and review them whenever you return.',
  },
]

// Public landing page. Signed-in visitors get a link straight to the
// dashboard instead of the sign-up buttons.
export default function HomePage() {
  const { AccessToken } = useAuth()

  return (
    <main className="entry-page home-page">
      <section className="hero-section">
        <p className="eyebrow">MARKET INTELLIGENCE PLATFORM</p>

        <h1>
          Make smarter moves
          <br />
          in the market.
        </h1>

        <p className="hero-text">
          Track stocks, crypto, ETFs, market sentiment, news, and your
          personal watchlist in one focused workspace.
        </p>

        <div className="hero-actions">
          {AccessToken ? (
            <Link className="primary-link" to="/home">
              Go to your workspace
            </Link>
          ) : (
            <>
              <Link className="primary-link" to="/login">
                Login
              </Link>

              <Link className="secondary-link" to="/register">
                Create an account
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="feature-grid">
        {FEATURES.map(feature => (
          <article key={feature.title} className="feature-card">
            <span className="feature-icon">{feature.icon}</span>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
