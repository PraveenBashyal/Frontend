import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useChartColors } from "../../lib/chartTheme";

// Two series on one axis. Prices are rebased to percent change from each
// series' own first point, so $227 and $96,000 stay comparable.
function rebase(points) {
  if (!points.length) return new Map();

  const first = Number(points[0].value);
  if (!first) return new Map();

  return new Map(
    points.map((point) => [
      point.t,
      ((Number(point.value) - first) / first) * 100,
    ])
  );
}

function Tip({ active, payload, label, labelA, labelB }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-label">{label}</span>

      {payload.map((entry) => (
        <span key={entry.dataKey} style={{ color: entry.stroke }}>
          {entry.dataKey === "a" ? labelA : labelB}:{" "}
          {entry.value.toFixed(2)}%
        </span>
      ))}
    </div>
  );
}

export default function CompareChart({ title, seriesA, seriesB, labelA, labelB }) {
  const colors = useChartColors();

  const toPoints = (series) =>
    series.map((item) => ({
      t: new Date(item.recordedAt).getTime(),
      value: item.price,
    }));

  const a = rebase(toPoints(seriesA));
  const b = rebase(toPoints(seriesB));

  // Union of both timelines so neither series is cut short
  const times = [...new Set([...a.keys(), ...b.keys()])].sort((x, y) => x - y);

  const data = times.map((t) => ({
    time: new Date(t).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    a: a.get(t) ?? null,
    b: b.get(t) ?? null,
  }));

  return (
    <section className="stock-chart-card compare-chart">
      <header className="compare-chart-header">
        <h3>{title}</h3>

        <div className="compare-legend">
          <span style={{ color: colors.up }}>● {labelA}</span>
          <span style={{ color: colors.accent }}>● {labelB}</span>
        </div>
      </header>

      {data.length === 0 ? (
        <p className="portfolio-message">No price history to compare yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />

            <XAxis
              dataKey="time"
              stroke={colors.axis}
              tick={{ fill: colors.tick, fontSize: 11 }}
              minTickGap={28}
            />

            <YAxis
              stroke={colors.axis}
              tick={{ fill: colors.tick, fontSize: 11 }}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              width={52}
            />

            <Tooltip content={<Tip labelA={labelA} labelB={labelB} />} />

            <Line
              type="monotone"
              dataKey="a"
              stroke={colors.up}
              strokeWidth={2}
              dot={false}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="b"
              stroke={colors.accent}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
