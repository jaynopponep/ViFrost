import { useCallback, useEffect, useRef, useState } from 'react'

export type Envelope<T = unknown> = {
  type: string
  payload?: T
}

export type GameStartPayload = {
  roomId: string
  snippet: string
  duration: number
}

export type KeybindPayload = {
  keys: string
  complex: boolean
  penalty: boolean
}

export type GameEndPayload = {
  keybindsUsed?: KeybindPayload[]
  score?: number
}

export type ErrorPayload = { message: string }

export type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error'

const DEFAULT_WS_URL = `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8080/ws`

export interface UseWebSocketOptions {
  url?: string
  onMessage?: (envelope: Envelope) => void
  connectImmediately?: boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = DEFAULT_WS_URL,
    onMessage,
    connectImmediately = true,
  } = options

  const [status, setStatus] = useState<WebSocketStatus>('closed')
  const [lastMessage, setLastMessage] = useState<Envelope | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    setStatus('connecting')
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setStatus('open')
    ws.onclose = () => {
      setStatus('closed')
      wsRef.current = null
    }
    ws.onerror = () => setStatus('error')

    ws.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data as string) as Envelope
        setLastMessage(envelope)
        onMessageRef.current?.(envelope)
      } catch {
        setLastMessage({ type: 'error', payload: { message: 'Invalid JSON' } })
      }
    }

    return () => {
      ws.close()
    }
  }, [url])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    setStatus('closed')
    setLastMessage(null)
  }, [])

  const send = useCallback((type: string, payload?: unknown) => {
    const ws = wsRef.current
    if (ws?.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type, payload: payload ?? null }))
  }, [])

  const sendJoinQueue = useCallback(() => send('join_queue'), [send])
  const sendKeybind = useCallback(
    (payload: KeybindPayload) => send('keybind', payload),
    [send]
  )
  const sendPing = useCallback(() => send('ping'), [send])
  const sendLeave = useCallback(() => send('leave'), [send])

  useEffect(() => {
    if (connectImmediately) connect()
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connectImmediately, connect])

  return {
    status,
    lastMessage,
    connect,
    disconnect,
    send,
    sendJoinQueue,
    sendKeybind,
    sendPing,
    sendLeave,
    isOpen: status === 'open',
  }
}
