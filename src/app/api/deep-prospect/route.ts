import { NextRequest, NextResponse } from 'next/server'
import { buildManusPrompt } from '@/config/deepProspect'

const MANUS_API_KEY = process.env.MANUS_API_KEY || ''
const MANUS_BASE_URL = 'https://open.manus.im/v1'

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
        'Authorization': `Bearer ${MANUS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        title: `Deep Prospect: ${ownerName} — ${address}`
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
      taskId: data.id || data.task_id || data.taskId,
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
        'Authorization': `Bearer ${MANUS_API_KEY}`
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

    // Extract result content from possible response shapes
    let result = ''
    if (isCompleted) {
      result = data.result
        || data.output
        || data.content
        || data.response
        || data.messages?.find((m: any) => m.role === 'assistant')?.content
        || ''
    }

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
