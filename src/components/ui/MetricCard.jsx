// tone: 'is-bullish' | 'is-bearish' | 'is-neutral' | 'is-none'
export default function MetricCard({ title, value, subtitle, tone = 'is-bullish' }) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-card__title">{title}</div>
      <div className="metric-card__value">{value}</div>
      <div className="metric-card__sub">{subtitle}</div>
    </div>
  )
}
