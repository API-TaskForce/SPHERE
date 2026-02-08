import fs from 'fs'
import path from 'path'
import { retrievePricingFromText } from 'pricing4ts/server'

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node parse-pricing.js <path-to-yaml>')
  process.exit(1)
}

try {
  const content = fs.readFileSync(filePath, 'utf-8')
  console.log('Parsed YAML content length:', content.length)
  const pricing = retrievePricingFromText(content)
  console.log('Parsed pricing:', JSON.stringify({ saasName: pricing.saasName, version: pricing.version }, null, 2))

  // Attempt to extract analytics (this may fail and reproduce the server error)
  try {
    const { PricingService: PricingAnalytics } = await import('pricing4ts/server')
    const analyticsService = new PricingAnalytics(pricing)
    const analytics = await analyticsService.getAnalytics()
    console.log('Analytics keys:', Object.keys(analytics))
  } catch (err) {
    console.error('ANALYTICS ERROR:', (err).message)
    console.error(err)
    process.exit(1)
  }

} catch (err) {
  console.error('ERROR:', (err).message)
  console.error(err)
  process.exit(1)
}
