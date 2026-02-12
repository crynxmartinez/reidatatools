import { NextRequest } from 'next/server'
import { getCountyByName } from '@/config/scrapers'
import { searchOSCN, fetchCaseDetails, OSCNCase } from '@/services/oscn'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// SSE helper: send an event to the stream
function sendEvent(controller: ReadableStreamDefaultController, event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(payload))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, county, fromDate, toDate } = body

  if (!type || !county) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const countyConfig = getCountyByName(county)
  if (!countyConfig) {
    return new Response(JSON.stringify({ error: `County "${county}" not found` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const isOSCN = countyConfig.state === 'OK' && countyConfig.oscnCode

  if (!isOSCN) {
    return new Response(JSON.stringify({ error: 'Streaming only supported for Oklahoma (OSCN) counties' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Determine case types based on scrape type
        let caseTypes: string[] = []
        if (type === 'evictions') {
          caseTypes = countyConfig.evictions?.caseTypes || ['SC', 'CS']
        } else if (type === 'foreclosures') {
          caseTypes = countyConfig.foreclosures?.caseTypes || ['CV', 'CJ']
        } else if (type === 'probate') {
          caseTypes = countyConfig.probate?.caseTypes || ['PB', 'PG']
        }

        sendEvent(controller, 'progress', {
          stage: 'searching',
          message: `Searching ${county} County court records...`
        })

        // Step 1: Search for cases
        const cases = await searchOSCN({
          county: countyConfig.oscnCode!,
          caseTypes,
          fromDate,
          toDate
        })

        sendEvent(controller, 'progress', {
          stage: 'found',
          message: `Found ${cases.length} cases. Fetching details...`,
          count: cases.length
        })

        // Send initial results immediately (even without details)
        sendEvent(controller, 'results', {
          cases: formatCases(cases, type),
          partial: true
        })

        // Step 2: Fetch details for cases missing info
        const casesNeedingDetails = cases.filter(
          c => c.plaintiff === 'See Case Details' || c.defendant === 'See Case Details'
        )

        const maxDetails = Math.min(casesNeedingDetails.length, 25)
        const batchSize = 3
        let fetched = 0

        for (let i = 0; i < maxDetails; i += batchSize) {
          const batch = casesNeedingDetails.slice(i, i + batchSize)

          await Promise.all(batch.map(async (caseItem) => {
            const details = await fetchCaseDetails(caseItem.link)
            if (details.plaintiff) caseItem.plaintiff = details.plaintiff
            if (details.defendant) caseItem.defendant = details.defendant
            if (details.filingDate) caseItem.filingDate = details.filingDate
            if (details.propertyAddress) caseItem.propertyAddress = details.propertyAddress
            if (details.amount) caseItem.amount = details.amount
            if (details.judge) caseItem.judge = details.judge
            if (details.status) caseItem.status = details.status
            if (details.attorneys) caseItem.attorneys = details.attorneys
            fetched++
          }))

          sendEvent(controller, 'progress', {
            stage: 'details',
            message: `Fetched details for ${Math.min(fetched, maxDetails)}/${maxDetails} cases...`,
            fetched: Math.min(fetched, maxDetails),
            total: maxDetails
          })

          // Send updated results after each batch
          sendEvent(controller, 'results', {
            cases: formatCases(cases, type),
            partial: i + batchSize < maxDetails
          })

          // Delay between batches
          if (i + batchSize < maxDetails) {
            await new Promise(resolve => setTimeout(resolve, 800))
          }
        }

        // Final results
        sendEvent(controller, 'complete', {
          cases: formatCases(cases, type),
          total: cases.length,
          dataSource: 'OSCN'
        })

      } catch (error: any) {
        sendEvent(controller, 'error', {
          message: error.message || 'Scraping failed'
        })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}

function formatCases(cases: OSCNCase[], type: string): any[] {
  if (type === 'evictions') {
    return cases.map(c => ({
      caseNumber: c.caseNumber,
      filingDate: c.filingDate,
      plaintiff: c.plaintiff,
      defendant: c.defendant,
      address: c.propertyAddress || 'See Case Details',
      status: c.status,
      county: c.county,
      caseType: c.caseTypeDescription,
      link: c.link
    }))
  } else if (type === 'foreclosures') {
    return cases.map(c => ({
      caseNumber: c.caseNumber,
      filingDate: c.filingDate,
      auctionDate: '',
      owner: c.defendant || 'See Case Details',
      lender: c.plaintiff || 'See Case Details',
      address: c.propertyAddress || 'See Case Details',
      amount: c.amount || '',
      status: c.status,
      county: c.county,
      caseType: c.caseTypeDescription,
      link: c.link
    }))
  } else if (type === 'probate') {
    return cases.map(c => ({
      caseNumber: c.caseNumber,
      filingDate: c.filingDate,
      decedent: c.defendant || 'See Case Details',
      executor: c.plaintiff || 'See Case Details',
      caseType: c.caseTypeDescription,
      propertyAddress: c.propertyAddress || 'See Case Details',
      estimatedValue: c.amount || '',
      status: c.status,
      county: c.county,
      link: c.link
    }))
  }
  return cases
}
