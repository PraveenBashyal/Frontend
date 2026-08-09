// Builds the answer. Whatever the user asks, the reply is written from the
// facts gathered first — the model is only allowed to phrase them, and when
// no key is configured a plain summariser does the phrasing instead.

const SYSTEM_PROMPT = `You are the assistant inside a market sentiment dashboard.

Rules:
- Answer only from the DATA block. Never use outside knowledge about prices,
  companies or markets.
- If the data does not cover the question, say so plainly and name what is
  missing. Do not guess.
- Never recommend buying, selling or holding. Describe what the numbers show
  and stop there.
- Two or three sentences. Plain sentences, no bullet points, no markdown.`

const money = n =>
  n === null || n === undefined ? 'unknown' : `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

const percent = n =>
  n === null || n === undefined ? 'unknown' : `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`

// Turns the gathered facts into the block the model is allowed to use
export function renderFacts(facts) {
  const lines = []

  if (facts.symbol) lines.push(`The user is looking at ${facts.symbol}.`)

  if (facts.quotes.length) {
    lines.push('Live prices:')
    facts.quotes.forEach(q =>
      lines.push(`- ${q.symbol} (${q.name}) ${money(q.price)}, ${percent(q.changePercent)} today, trades on ${q.market || 'unknown'}`)
    )
  }

  if (facts.portfolio.holdings.length) {
    const s = facts.portfolio.summary
    lines.push(`Portfolio: ${s.holdings} holdings, invested ${money(s.cost)}, now worth ${money(s.value)}, profit ${money(s.profit)} (${percent(s.profitPercent)}).`)
    facts.portfolio.holdings.forEach(h =>
      lines.push(`- ${h.quantity} ${h.symbol} bought ${h.buyDate} at ${money(h.buyPrice)}, now ${money(h.price)}, profit ${money(h.profit)} (${percent(h.profitPercent)})`)
    )
  } else {
    lines.push('Portfolio: empty, the user has not added any holdings.')
  }

  if (facts.watchlist.length) {
    lines.push(`Watchlist: ${facts.watchlist.map(w => w.symbol).join(', ')}.`)
  } else {
    lines.push('Watchlist: empty.')
  }

  if (facts.news.length) {
    lines.push('Recent headlines:')
    facts.news.forEach(n => lines.push(`- ${n.source}: ${n.headline}`))
  }

  lines.push('Sentiment scores and predictions: not available yet, the analysis service is not connected.')

  return lines.join('\n')
}

// Used when no GROQ_API_KEY is set, and as the fallback if the call fails.
// Same facts, assembled by hand rather than by a model.
function summarise(message, facts) {
  const q = message.toLowerCase()
  const { holdings, summary } = facts.portfolio

  if (/profit|loss|lose|gain|perform|doing/.test(q) && holdings.length) {
    const best  = [...holdings].sort((a, b) => (b.profitPercent ?? -1e9) - (a.profitPercent ?? -1e9))[0]
    const worst = [...holdings].sort((a, b) => (a.profitPercent ?? 1e9) - (b.profitPercent ?? 1e9))[0]
    return `Your portfolio cost ${money(summary.cost)} and is worth ${money(summary.value)} now, a profit of ${money(summary.profit)} (${percent(summary.profitPercent)}). `
         + `${best.symbol} is your strongest at ${percent(best.profitPercent)}, ${worst.symbol} the weakest at ${percent(worst.profitPercent)}. `
         + `These are price movements only — no sentiment analysis is connected yet.`
  }

  if (/sentiment|mood|bullish|bearish|predict/.test(q)) {
    return `Sentiment scores and predictions are not available yet — the analysis service that produces them is not connected. `
         + `What the dashboard can show right now is live prices, news headlines and your own holdings.`
  }

  if (facts.symbol) {
    const quote = facts.quotes.find(x => x.symbol === facts.symbol)
    if (quote) {
      const held = holdings.filter(h => h.symbol === facts.symbol)
      const own  = held.length
        ? ` You hold ${held.reduce((s, h) => s + h.quantity, 0)} of it, currently ${percent(held[0].profitPercent)} against what you paid.`
        : ' It is not in your portfolio.'
      return `${quote.name} (${quote.symbol}) is at ${money(quote.price)}, ${percent(quote.changePercent)} on the day, trading on ${quote.market || 'an unlisted venue'}.${own} `
           + `No sentiment score is available for it yet.`
    }
  }

  if (holdings.length) {
    return `You are tracking ${summary.holdings} holdings worth ${money(summary.value)} against ${money(summary.cost)} invested, so ${percent(summary.profitPercent)} overall. `
         + `Your watchlist has ${facts.watchlist.length} assets. Ask about any of them, or open one to see its price history.`
  }

  return `There is nothing in your portfolio yet, and your watchlist has ${facts.watchlist.length} assets. `
       + `Add a holding on the Portfolio page and I can tell you how it is doing.`
}

async function callGroq(message, factBlock, history) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6).map(h => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: String(h.text || '').slice(0, 1000),
    })),
    { role: 'user', content: `DATA:\n${factBlock}\n\nQUESTION: ${message}` },
  ]

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.2,
        max_tokens: 300,
      }),
      signal: controller.signal,
    })

    if (!response.ok) return null
    const body = await response.json()
    return body.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function answer(message, facts, history) {
  const factBlock = renderFacts(facts)

  if (process.env.GROQ_API_KEY) {
    const text = await callGroq(message, factBlock, history)
    // Falls through to the summariser if the model is unreachable
    if (text) return { text, model: process.env.GROQ_MODEL || 'groq' }
  }

  return { text: summarise(message, facts), model: 'built-in' }
}

// What the answer was based on, shown under each reply
export function citations(facts) {
  const sources = []

  facts.news.forEach(n =>
    sources.push({ platform: n.source || 'News', text: n.headline, symbol: facts.symbol || null })
  )
  facts.quotes.slice(0, 2).forEach(q =>
    sources.push({ platform: q.market || 'Market', text: `${q.symbol} at ${money(q.price)}`, symbol: q.symbol })
  )
  if (facts.portfolio.holdings.length) {
    sources.push({
      platform: 'Your portfolio',
      text: `${facts.portfolio.summary.holdings} holdings, ${percent(facts.portfolio.summary.profitPercent)} overall`,
      symbol: null,
    })
  }

  return sources.slice(0, 4)
}
