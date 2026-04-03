export const config = { runtime: 'edge' }

const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY
const SHOPIFY_DOMAIN  = process.env.SHOPIFY_DOMAIN
const SHOPIFY_TOKEN   = process.env.SHOPIFY_STOREFRONT_TOKEN
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://leafywell.com,https://www.leafywell.com')
  .split(',').map(s => s.trim())

const SYSTEM_BASE = `You are a knowledgeable, friendly supplement advisor for Leafywell — "Nature has a Remedy."

Brand voice: clean, science-informed, approachable but authoritative. Never overclaim health benefits. Avoid pharmaceutical language. Never say "FDA approved."

When referencing any health benefit always include:
"*These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."

Rules:
- Answer concisely (2-5 sentences unless more detail is clearly needed)
- Reference specific ingredients and data from the product context provided
- Always recommend consulting a healthcare professional for medical decisions
- Stay on topic: supplements, ingredients, usage, Leafywell products only
- Use **bold** for key ingredient names or important terms when helpful`

function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  }
}

async function getProductCtx(handle) {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN || !handle) return null
  const q = `{
    product(handle:"${handle}") {
      title description
      priceRange { minVariantPrice { amount currencyCode } }
      qa:       metafield(namespace:"leafywell",key:"qa_context")       { value }
      facts:    metafield(namespace:"leafywell",key:"supplement_facts")  { value }
      benefits: metafield(namespace:"leafywell",key:"key_benefits")      { value }
      usage:    metafield(namespace:"leafywell",key:"suggested_use")     { value }
      certs:    metafield(namespace:"leafywell",key:"certifications")    { value }
      warnings: metafield(namespace:"leafywell",key:"warnings")          { value }
    }
  }`
  try {
    const res  = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN },
      body: JSON.stringify({ query: q })
    })
    const data = await res.json()
    const p    = data?.data?.product
    if (!p) return null
    if (p.qa?.value) return p.qa.value
    const price = p.priceRange?.minVariantPrice
    return [
      `Product: ${p.title}`,
      price ? `Price: $${parseFloat(price.amount).toFixed(2)}` : '',
      p.description     ? `Description: ${p.description}`          : '',
      p.facts?.value    ? `Supplement Facts:\n${p.facts.value}`    : '',
      p.benefits?.value ? `Key Benefits:\n${p.benefits.value}`     : '',
      p.usage?.value    ? `Suggested Use: ${p.usage.value}`        : '',
      p.certs?.value    ? `Certifications: ${p.certs.value}`       : '',
      p.warnings?.value ? `Warnings: ${p.warnings.value}`          : ''
    ].filter(Boolean).join('\n')
  } catch { return null }
}

async function getCollectionCtx(handle) {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN || !handle) return null
  const q = `{
    collection(handle:"${handle}") {
      title
      products(first:20) {
        nodes {
          title
          metafield(namespace:"leafywell",key:"qa_context") { value }
        }
      }
    }
  }`
  try {
    const res  = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN },
      body: JSON.stringify({ query: q })
    })
    const data = await res.json()
    const col  = data?.data?.collection
    if (!col) return null
    const prods = col.products.nodes
      .map(p => p.metafield?.value || `Product: ${p.title}`)
      .join('\n\n---\n\n')
    return `Category: ${col.title}\n\n${prods}`
  } catch { return null }
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || ''

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })
  if (req.method !== 'POST')   return new Response('Method not allowed', { status: 405 })
  if (!ANTHROPIC_KEY)          return new Response(
    JSON.stringify({ error: 'Server configuration error' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )

  let body
  try   { body = await req.json() }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }

  const { question, productHandle, collectionHandle, staticContext, history } = body

  if (!question || typeof question !== 'string' || question.length > 1000)
    return new Response(JSON.stringify({ error: 'Invalid question' }), { status: 400 })

  let ctx = staticContext || null
  if (!ctx && productHandle)    ctx = await getProductCtx(productHandle)
  if (!ctx && collectionHandle) ctx = await getCollectionCtx(collectionHandle)
  if (!ctx) ctx = 'No product context loaded. Provide general Leafywell brand information and direct the customer to leafywell.com for product details.'

  const safeHistory = Array.isArray(history)
    ? history.slice(-10).filter(m => m && ['user','assistant'].includes(m.role) && typeof m.content === 'string')
    : []

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: `${SYSTEM_BASE}\n\nCURRENT PRODUCT CONTEXT:\n${ctx}`,
        messages: [...safeHistory, { role: 'user', content: question }]
      })
    })

    if (!r.ok) {
      console.error('Claude error:', await r.text())
      return new Response(
        JSON.stringify({ error: 'AI service unavailable. Please try again.' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...cors(origin) } }
      )
    }

    const data   = await r.json()
    const answer = data.content?.find(b => b.type === 'text')?.text || 'Unable to generate a response.'
    return new Response(
      JSON.stringify({ answer }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...cors(origin) } }
    )
  } catch (e) {
    console.error('Proxy error:', e)
    return new Response(
      JSON.stringify({ error: 'Unexpected error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...cors(origin) } }
    )
  }
}
