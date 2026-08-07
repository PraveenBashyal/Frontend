import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useChartColors } from './chartTheme'

const WINDOWS = {
  '1D': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  'All': Infinity,
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart__tooltip">
        <div className="chart__tooltip-label">{label}</div>
        <div className="chart__tooltip-value text-up">
          ${payload[0].value.toLocaleString()}
        </div>
      </div>
    )
  }
  return null
}

export default function PriceChart({ data = [], timeFilter, onFilterChange }) {
  const CHART = useChartColors()
  const span = WINDOWS[timeFilter] ?? Infinity

  // Measured from the newest data point, not Date.now(), so render stays
  // pure and old history still filters correctly.
  const latest = data.length
    ? Math.max(...data.map(point => new Date(point.recordedAt).getTime()))
    : 0
  const cutoff = span === Infinity ? 0 : latest - span

  const chartData = data
    .filter(point => new Date(point.recordedAt).getTime() >= cutoff)
    .map(point => ({
      time: new Date(point.recordedAt).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
      }),
      price: Number(point.price),
    }))

  return (
    <div className="panel">
      <div className="chart__header">
        <div className="chart__title">Historical Price Chart</div>

        <div className="filter-group">
          {Object.keys(WINDOWS).map(filter => (
            <button
              key={filter}
              className={`filter-btn${timeFilter === filter ? ' filter-btn--active' : ''}`}
              onClick={() => onFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="chart__empty chart__empty--price">
          {data.length === 0
            ? 'No price history yet'
            : `No data points in the last ${timeFilter}`}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART.up} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART.up} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
            <XAxis
              dataKey="time"
              stroke={CHART.axis}
              tick={{ fill: CHART.tick, fontSize: 11 }}
              minTickGap={24}
            />
            <YAxis
              stroke={CHART.axis}
              tick={{ fill: CHART.tick, fontSize: 11 }}
              domain={['auto', 'auto']}
              tickFormatter={v => `$${v.toLocaleString()}`}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={CHART.up}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
