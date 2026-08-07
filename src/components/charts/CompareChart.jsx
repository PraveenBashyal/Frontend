import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useChartColors } from './chartTheme'

// Two series on one axis. Prices are rebased to percent change from each
// series' own first point, so $227 and $96,000 stay comparable.
function rebase(points, valueKey) {
  if (!points.length) return new Map()
  const first = Number(points[0][valueKey])
  if (!first) return new Map()

  return new Map(points.map(point => [
    point.t,
    ((Number(point[valueKey]) - first) / first) * 100,
  ]))
}

// Sentiment is already 0..1, so it is shown as-is rather than rebased
function raw(points, valueKey) {
  return new Map(points.map(point => [point.t, Number(point[valueKey])]))
}

function Tip({ active, payload, label, unit, labelA, labelB }) {
  if (!active || !payload?.length) return null

  return (
    <div className="chart__tooltip">
      <div className="chart__tooltip-label">{label}</div>
      {payload.map(entry => (
        <div key={entry.dataKey} style={{ color: entry.stroke }}>
          {entry.dataKey === 'a' ? labelA : labelB}:{' '}
          {unit === '%' ? `${entry.value.toFixed(2)}%` : entry.value.toFixed(2)}
        </div>
      ))}
    </div>
  )
}

export default function CompareChart({
  title, seriesA, seriesB, labelA, labelB, timeKey, valueKey, mode = 'percent',
}) {
  const CHART = useChartColors()

  const toPoints = series => series.map(item => ({
    t: new Date(item[timeKey]).getTime(),
    [valueKey]: item[valueKey],
  }))

  const project = mode === 'percent' ? rebase : raw
  const a = project(toPoints(seriesA), valueKey)
  const b = project(toPoints(seriesB), valueKey)

  // Union of both timelines so neither series is cut short
  const times = [...new Set([...a.keys(), ...b.keys()])].sort((x, y) => x - y)

  const data = times.map(t => ({
    time: new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    a: a.get(t) ?? null,
    b: b.get(t) ?? null,
  }))

  const empty = !seriesA.length && !seriesB.length

  return (
    <div className="panel">
      <div className="chart__header">
        <div className="chart__title">{title}</div>

        <div className="chart__legend">
          <span style={{ color: CHART.up }}>● {labelA}</span>
          <span style={{ color: CHART.accent2 }}>● {labelB}</span>
        </div>
      </div>

      {empty ? (
        <div className="chart__empty chart__empty--price">No data to compare yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
            <XAxis
              dataKey="time"
              stroke={CHART.axis}
              tick={{ fill: CHART.tick, fontSize: 11 }}
              minTickGap={28}
            />
            <YAxis
              stroke={CHART.axis}
              tick={{ fill: CHART.tick, fontSize: 11 }}
              domain={mode === 'percent' ? ['auto', 'auto'] : [0, 1]}
              tickFormatter={v => (mode === 'percent' ? `${v.toFixed(0)}%` : v.toFixed(1))}
              width={56}
            />
            <Tooltip
              content={<Tip unit={mode === 'percent' ? '%' : ''} labelA={labelA} labelB={labelB} />}
            />
            <Line
              type="monotone" dataKey="a" stroke={CHART.up}
              strokeWidth={2} dot={false} connectNulls
            />
            <Line
              type="monotone" dataKey="b" stroke={CHART.accent2}
              strokeWidth={2} dot={false} connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
