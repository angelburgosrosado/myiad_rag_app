export const config = { runtime: 'edge' }

export default function handler() {
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'leafywell-qa-rag',
    timestamp: new Date().toISOString(),
    env: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      shopify:   !!process.env.SHOPIFY_DOMAIN,
      token:     !!process.env.SHOPIFY_STOREFRONT_TOKEN,
      origins:   process.env.ALLOWED_ORIGINS || 'defaults'
    }
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
