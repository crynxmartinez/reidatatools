import { NextRequest, NextResponse } from 'next/server'
import { buildManusPrompt } from '@/config/deepProspect'

const MANUS_API_KEY = process.env.MANUS_API_KEY || ''
const MANUS_BASE_URL = 'https://api.manus.ai/v1'

export async function POST(request: NextRequest) {
  try {
    if (!MANUS_API_KEY) {
      return NextResponse.json({ error: 'MANUS_API_KEY is not configured.' }, { status: 500 })
    }

    const body = await request.json()
    const { ownerName, address, extraContext } = body

    if (!ownerName || !address) {
      return NextResponse.json({ error: 'Owner name and address are required.' }, { status: 400 })
    }

    const prompt = buildManusPrompt({
      ownerName,
      address,
      extraContext: extraContext || undefined
    })

    console.log(`[DeepProspect] Creating Manus task for: ${ownerName} @ ${address}`)

    const response = await fetch(`${MANUS_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'API_KEY': MANUS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        agentProfile: 'manus-1.6'
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[DeepProspect] Manus API error:', err)
      return NextResponse.json(
        { error: `Manus API error: ${response.status} — ${err}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[DeepProspect] Task created:', data)

    return NextResponse.json({
      success: true,
      taskId: data.task_id,
      taskUrl: data.task_url,
      status: data.status || 'pending'
    })

  } catch (error: any) {
    console.error('[DeepProspect] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!MANUS_API_KEY) {
      return NextResponse.json({ error: 'MANUS_API_KEY is not configured.' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required.' }, { status: 400 })
    }

    console.log(`[DeepProspect] Polling task: ${taskId}`)

    const response = await fetch(`${MANUS_BASE_URL}/tasks/${taskId}`, {
      headers: {
        'API_KEY': MANUS_API_KEY
      }
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json(
        { error: `Manus API error: ${response.status} — ${err}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Normalize status across possible Manus API response shapes
    const status = data.status || 'pending'
    const isCompleted = status === 'completed' || status === 'done' || status === 'finished' || status === 'success'
    const isFailed = status === 'failed' || status === 'error'

    // Extract result — Manus returns a messages array
    // Each message: { id, status, role, type, content: [{type, text}] }
    // We want all output_text blocks from assistant messages, joined together
    let result = ''
    if (isCompleted) {
      const messages = data.messages || data.result?.messages || []
      if (Array.isArray(messages) && messages.length > 0) {
        const textParts: string[] = []
        for (const msg of messages) {
          if (msg.role !== 'assistant') continue
          if (!Array.isArray(msg.content)) continue
          for (const block of msg.content) {
            if (block.type === 'output_text' && typeof block.text === 'string' && block.text.trim()) {
              textParts.push(block.text.trim())
            }
          }
        }
        result = textParts.join('\n\n---\n\n')
      }

      // Fallback
      if (!result) {
        const fallback = data.result || data.output || data.response || data.content
        result = typeof fallback === 'string' ? fallback : JSON.stringify(fallback || '', null, 2)
      }
    }

    console.log('[DeepProspect] Poll status:', data.status, '| result length:', result.length)

    return NextResponse.json({
      success: true,
      taskId,
      status: isCompleted ? 'completed' : isFailed ? 'failed' : 'running',
      result,
      raw: data
    })

  } catch (error: any) {
    console.error('[DeepProspect] Poll error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
