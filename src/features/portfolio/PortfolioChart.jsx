import { useState } from "react";
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

// "Up 40%" means nothing on its own — the whole market may have risen
// more. Every line is rebased to percent change from the first day, so
// they can be read against each other.
//
// The portfolio line follows `growth`, not the raw value: money paid in
// partway through raises the value without being a gain, and the server
// has already stripped that out.
function rebase(rows, pick) {
  const first = rows.map(pick).find((value) => value !== null && value !== undefined);
  if (!first) return () => null;

  return (row) => {
    const value = pick(row);
    if (value === null || value === undefined) return null;
    return ((value - first) / first) * 100;
  };
}

function Tip({ active, payload, label, names }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-label">{label}</span>

      {payload.map((entry) => (
        <span key={entry.dataKey} style={{ color: entry.stroke }}>
          {names[entry.dataKey]}: {entry.value.toFixed(2)}%
        </span>
      ))}
    </div>
  );
}

export default function PortfolioChart({ history, benchmark, indexes = [] }) {
  const colors = useChartColors();

  // Which lines are drawn. Hiding one also drops it from the vertical
  // scale, which is the point: Bitcoin can swing ten times as far as the
  // S&P, and while it is on the chart everything else looks flat.
  const [hidden, setHidden] = useState([]);

  if (history.length < 2) return null;

  const toggle = (key) =>
    setHidden((current) =>
      current.includes(key)
        ? current.filter((one) => one !== key)
        : [...current, key]
    );

  const asMine = rebase(history, (row) => row.growth);

  const readIndex = {};
  for (const symbol of indexes) {
    readIndex[symbol] = rebase(history, (row) => row.indexes?.[symbol]);
  }

  const data = history.map((row) => {
    // Fixed en-GB, so the day and month do not swap around by locale
    const point = {
      day: new Date(row.day).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      mine: asMine(row),
    };

    for (const symbol of indexes) point[symbol] = readIndex[symbol](row);

    return point;
  });

  const palette = [colors.accent, colors.violet];

  const lines = [
    { key: "mine", label: "Your portfolio", colour: colors.up },
    ...indexes.map((symbol, i) => ({
      key: symbol,
      label: symbol,
      colour: palette[i % palette.length],
    })),
  ];

  const shown = lines.filter((line) => !hidden.includes(line.key));

  // Room around the visible lines, so none is drawn along an edge
  let low = 0;
  let high = 0;

  for (const point of data) {
    for (const line of shown) {
      const value = point[line.key];
      if (value !== null && value !== undefined) {
        low = Math.min(low, value);
        high = Math.max(high, value);
      }
    }
  }

  const padding = Math.max((high - low) * 0.15, 0.3);
  const last = data[data.length - 1];

  const names = Object.fromEntries(lines.map((line) => [line.key, line.label]));

  const mine = last.mine;
  const blended = rebase(history, (row) => row.benchmark)(history[history.length - 1]);

  return (
    <section className="stock-chart-card compare-chart">
      <header className="compare-chart-header">
        <h3>Your portfolio against the market</h3>

        <div className="compare-legend">
          {lines.map((line) => (
            <button
              type="button"
              key={line.key}
              className={
                hidden.includes(line.key)
                  ? "legend-toggle legend-off"
                  : "legend-toggle"
              }
              style={{ color: hidden.includes(line.key) ? undefined : line.colour }}
              onClick={() => toggle(line.key)}
              title={
                hidden.includes(line.key) ? "Show this line" : "Hide this line"
              }
            >
              ● {line.label}
            </button>
          ))}
        </div>
      </header>

      {mine !== null && blended !== null && (
        <p className="compare-thin">
          Over the past month your holdings moved {mine.toFixed(2)}%. Held
          passively in the same proportions, {benchmark} would have moved{" "}
          {blended.toFixed(2)}% — so choosing these assets put you{" "}
          {Math.abs(mine - blended).toFixed(2)} points{" "}
          {mine >= blended ? "ahead" : "behind"}. Money paid in during the
          month is left out, so this is price movement only.
        </p>
      )}

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />

          <XAxis
            dataKey="day"
            stroke={colors.axis}
            tick={{ fill: colors.tick, fontSize: 11 }}
            minTickGap={28}
          />

          <YAxis
            stroke={colors.axis}
            tick={{ fill: colors.tick, fontSize: 11 }}
            tickFormatter={(v) => `${v.toFixed(high - low < 5 ? 1 : 0)}%`}
            domain={[low - padding, high + padding]}
            width={58}
          />

          <Tooltip content={<Tip names={names} />} />

          {shown.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.colour}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
