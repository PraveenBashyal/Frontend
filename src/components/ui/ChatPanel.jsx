import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { sendChatMessage } from '../../data'
import { useAuth } from '../../api/AuthContext'

// Slide-over assistant, answering from the app's own data.
// Rendered outside <Routes> so navigating keeps the conversation.
export const OPEN_CHAT = 'open-chat'

const SUGGESTIONS = [
  'Why is this bearish?',
  'Summarise this week of sentiment',
  "What's driving my watchlist today?",
]

// Asset currently on screen, so questions can say "this"
function symbolFromPath(pathname) {
  const match = pathname.match(/^\/stock\/(.+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

export default function ChatPanel() {
  const location = useLocation()
  const { AccessToken } = useAuth()

  const [open,     setOpen]    = useState(false)
  const [messages, setMessages] = useState([])
  const [draft,    setDraft]   = useState('')
  const [sending,  setSending] = useState(false)
  const [error,    setError]   = useState(null)

  const listRef = useRef(null)
  const symbol = symbolFromPath(location.pathname)

  useEffect(() => {
    const toggle = () => setOpen(prev => !prev)
    window.addEventListener(OPEN_CHAT, toggle)
    return () => window.removeEventListener(OPEN_CHAT, toggle)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Keep the newest message in view
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, sending])

  const ask = useCallback(async text => {
    const question = text.trim()
    if (!question || sending) return

    setDraft('')
    setError(null)
    setSending(true)
    setMessages(prev => [...prev, { role: 'user', text: question }])

    try {
      const reply = await sendChatMessage(question, { symbol })
      setMessages(prev => [...prev, {
        role:    'assistant',
        text:    reply.answer,
        sources: reply.sources || [],
      }])
    } catch (err) {
      setError(err.message || 'Could not reach the assistant')
    } finally {
      setSending(false)
    }
  }, [sending, symbol])

  if (!AccessToken) return null

  return (
    <>
      {open && <div className="chat-scrim" onClick={() => setOpen(false)} />}

      <aside
        className={`chat${open ? ' chat--open' : ''}`}
        aria-hidden={!open}
        aria-label="Market assistant"
      >
        <div className="chat__header">
          <div>
            <div className="chat__title">Assistant</div>
            {symbol && <div className="chat__context">Asking about {symbol}</div>}
          </div>
          <button
            className="btn btn--outline btn--xs"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
          >
            Close
          </button>
        </div>

        <div className="chat__log" ref={listRef}>
          {messages.length === 0 && (
            <div className="chat__intro">
              <p className="chat__intro-text">
                Ask about the sentiment, predictions and headlines already
                collected for your assets.
              </p>
              <div className="chat__suggestions">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    className="chat__suggestion"
                    onClick={() => ask(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => (
            <div key={i} className={`bubble bubble--${message.role}`}>
              <div className="bubble__text">{message.text}</div>

              {message.sources?.length > 0 && (
                <div className="bubble__sources">
                  <div className="bubble__sources-label">Based on</div>
                  {message.sources.map((source, j) => (
                    <div key={j} className="bubble__source">
                      <span className="bubble__source-platform">
                        {source.platform}
                      </span>
                      {source.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="bubble bubble--assistant bubble--pending">
              Thinking…
            </div>
          )}

          {error && <div className="state-error">{error}</div>}
        </div>

        <form
          className="chat__composer"
          onSubmit={e => { e.preventDefault(); ask(draft) }}
        >
          <input
            className="chat__input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={symbol ? `Ask about ${symbol}…` : 'Ask about your assets…'}
            aria-label="Message"
          />
          <button
            className="btn btn--primary btn--sm"
            type="submit"
            disabled={sending || !draft.trim()}
          >
            Send
          </button>
        </form>

        <div className="chat__disclaimer">
          Analysis of collected data. Not financial advice.
        </div>
      </aside>
    </>
  )
}
