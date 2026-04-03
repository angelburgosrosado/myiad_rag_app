import React, { useState, useRef, useEffect, useCallback } from 'react'
import { CATALOG } from './catalog.js'

const PROXY_URL = '/api/chat'

function LeafIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2C7 2 4 6 4 10c0 5 8 12 8 12s8-7 8-12c0-4-3-8-8-8z" />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--text3)', display: 'inline-block',
          animation: `lwbounce 1.2s infinite ${i * 0.2}s`
        }} />
      ))}
      <style>{`@keyframes lwbounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}

function formatText(text) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  )
}

function Message({ role, content, isTyping }) {
  const isUser = role === 'user'
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
      animation: 'lwfade 0.2s ease-out'
    }}>
      <style>{`@keyframes lwfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: isUser ? '#dbeafe' : 'var(--green)',
        color: isUser ? '#1e40af' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 600
      }}>
        {isUser ? 'You' : <LeafIcon size={14} />}
      </div>
      <div style={{
        maxWidth: '80%', padding: '9px 13px', borderRadius: 12,
        fontSize: 13, lineHeight: 1.6,
        background: isUser ? 'var(--green)' : 'var(--surface2)',
        color: isUser ? '#fff' : 'var(--text)',
        border: isUser ? 'none' : '0.5px solid var(--border)',
        borderTopLeftRadius: isUser ? 12 : 3,
        borderTopRightRadius: isUser ? 3 : 12,
      }}>
        {isTyping
          ? <TypingDots />
          : content.split('\n').map((line, i) => (
              <React.Fragment key={i}>{i > 0 && <br />}{formatText(line)}</React.Fragment>
            ))
        }
      </div>
    </div>
  )
}

function Sidebar({ selectedProduct, onSelect }) {
  const [openCat, setOpenCat] = useState(CATALOG[0].id)
  return (
    <div style={{
      width: 220, flexShrink: 0,
      borderRight: '0.5px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: 'var(--surface)'
    }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Product Catalog
        </div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
        {CATALOG.map(cat => (
          <div key={cat.id} style={{ marginBottom: 2 }}>
            <button
              onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '6px 8px',
                borderRadius: 7, border: 'none',
                background: openCat === cat.id ? 'var(--green-light)' : 'transparent',
                color: openCat === cat.id ? 'var(--green-mid)' : 'var(--text2)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}
            >
              <span>{cat.label}</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>{openCat === cat.id ? '▾' : '▸'}</span>
            </button>
            {openCat === cat.id && cat.products.map(p => {
              const active = selectedProduct?.id === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '5px 8px 5px 16px',
                    borderRadius: 7, border: 'none',
                    background: active ? '#d4eddf' : 'transparent',
                    color: active ? 'var(--green-mid)' : 'var(--text2)',
                    fontSize: 12, fontWeight: active ? 500 : 400,
                    display: 'block', cursor: 'pointer',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: 1
                  }}
                >
                  {p.name}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectProduct = useCallback((product) => {
    setSelectedProduct(product)
    setHistory([])
    setMessages([{
      role: 'assistant',
      content: `Hi! I have full details on **${product.name}** (${product.sku} · ${product.price}). What would you like to know?`
    }])
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const send = useCallback(async (text) => {
    const q = (text || input).trim()
    if (!q || !selectedProduct || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    const nextHistory = [...history, { role: 'user', content: q }]
    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          staticContext: selectedProduct.context,
          history: history.slice(-8)
        })
      })
      const data = await res.json()
      const answer = data.answer || 'Sorry, I could not get a response. Please try again.'
      setHistory([...nextHistory, { role: 'assistant', content: answer }])
      setMessages(prev => [...prev, { role: 'assistant', content: answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [input, selectedProduct, loading, history])

  const disabled = !selectedProduct || loading

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 20px', background: 'var(--surface)',
        borderBottom: '0.5px solid var(--border)', flexShrink: 0
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--green)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <LeafIcon size={16} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Leafywell</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Nature has a Remedy · Product Q&A Assistant</div>
        </div>
        {selectedProduct && (
          <div style={{
            marginLeft: 'auto', fontSize: 12, fontWeight: 500,
            background: 'var(--green-light)', color: 'var(--green-mid)',
            border: '0.5px solid var(--green-border)',
            borderRadius: 20, padding: '3px 11px'
          }}>
            {selectedProduct.name} · {selectedProduct.price}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar selectedProduct={selectedProduct} onSelect={selectProduct} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!selectedProduct ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--text3)', textAlign: 'center', gap: 10, paddingBottom: 80
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'var(--green-light)', color: 'var(--green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <LeafIcon size={26} />
                </div>
                <div style={{ fontWeight: 500, fontSize: 15, color: 'var(--text2)' }}>Select a product to get started</div>
                <div style={{ fontSize: 13 }}>Choose a category and product from the sidebar</div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => <Message key={i} role={m.role} content={m.content} />)}
                {loading && <Message role="assistant" isTyping />}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Quick-question chips */}
          {selectedProduct && !loading && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 5,
              padding: '8px 20px 6px',
              borderTop: '0.5px solid var(--border)'
            }}>
              {selectedProduct.chips.map((chip, i) => (
                <button key={i} onClick={() => send(chip)} style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 20,
                  border: '0.5px solid var(--border2)',
                  background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer'
                }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--green-light)'; e.currentTarget.style.color = 'var(--green-mid)' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text2)' }}
                >{chip}</button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{
            display: 'flex', gap: 8, padding: '10px 20px 14px',
            borderTop: '0.5px solid var(--border)', background: 'var(--surface)'
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={disabled}
              placeholder={selectedProduct ? `Ask about ${selectedProduct.name}...` : 'Select a product first...'}
              style={{
                flex: 1, fontSize: 13, padding: '9px 13px',
                borderRadius: 9, border: '0.5px solid var(--border2)',
                background: 'var(--surface)', color: 'var(--text)', outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--green)'}
              onBlur={e => e.target.style.borderColor = 'var(--border2)'}
            />
            <button
              onClick={() => send()}
              disabled={disabled || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: 9, border: 'none', flexShrink: 0,
                background: (disabled || !input.trim()) ? 'var(--border)' : 'var(--green)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (disabled || !input.trim()) ? 'default' : 'pointer'
              }}
            >
              <SendIcon />
            </button>
          </div>

          {/* FDA footer */}
          <div style={{
            padding: '0 20px 10px', fontSize: 10,
            color: 'var(--text3)', lineHeight: 1.4, background: 'var(--surface)'
          }}>
            *These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.
          </div>
        </div>
      </div>
    </div>
  )
}
