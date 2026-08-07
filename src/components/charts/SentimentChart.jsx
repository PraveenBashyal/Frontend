import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { useChartColors, BULLISH_AT, BEARISH_AT } from './chartTheme'
import { toneClass } from '../../data'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const score = Number(payload[0].value)
    const mood  = score >= BULLISH_AT ? 'Bullish'
                : score <= BEARISH_AT ? 'Bearish'
                : 'Neutral'
    return (
      <div className="chart__tooltip">
        <div className="chart__tooltip-label">{label}</div>
        <div className={`chart__tooltip-value prediction ${toneClass(mood)}`}>
          {score.toFixed(2)} — {mood}
        </div>
      </div>
    )
  }
  return null
}

export default function SentimentChart({ data = [] }) {
  const CHART = useChartColors()

  const chartData = data.map(point => ({
    time: new Date(point.analysedAt).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    }),
    score: Number(point.value),
  }))

  return (
    <div className="panel">
      <div className="chart__header">
        <div className="chart__title">Sentiment Trend</div>

        <div className="chart__legend">
          <span className="text-up">● Bullish &gt;{BULLISH_AT}</span>
          <span className="text-flat">● Neutral</span>
          <span className="text-down">● Bearish &lt;{BEARISH_AT}</span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="chart__empty chart__empty--sentiment">
          No sentiment history yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
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
              domain={[0, 1]}
              tickFormatter={v => v.toFixed(1)}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine
              y={BULLISH_AT} stroke={CHART.up} strokeDasharray="4 4"
              label={{ value: 'Bullish', fill: CHART.up, fontSize: 10, position: 'right' }}
            />
            <ReferenceLine
              y={BEARISH_AT} stroke={CHART.down} strokeDasharray="4 4"
              label={{ value: 'Bearish', fill: CHART.down, fontSize: 10, position: 'right' }}
            />

            <Line
              type="monotone"
              dataKey="score"
              stroke={CHART.accent2}
              strokeWidth={2}
              dot={{ fill: CHART.accent2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
