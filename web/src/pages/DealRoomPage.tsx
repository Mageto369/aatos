import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import io from 'socket.io-client'
import { ArrowLeft, Send, Paperclip, CheckCircle, Clock, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

interface Message {
  id: string
  senderUserId: string
  senderOrgId: string
  content: string
  messageType: string
  status: string
  createdAt: string
}

interface Deal {
  id: string
  title: string
  status: string
  totalValueUsd: number
  agreedQuantity: number
  agreedPrice: number
  buyerOrgName: string
  supplierOrgName: string
  milestones: Array<{
    id: string
    milestoneType: string
    status: string
    scheduledDate: string
    completedAt: string
  }>
}

export function DealRoomPage() {
  const { id } = useParams<{ id: string }>()
  const { user, token } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const socketRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const { data: deal } = useQuery<Deal>({
    queryKey: ['deal', id],
    queryFn: async () => {
      const res = await api.get(`/deals/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  useEffect(() => {
    if (!id || !token) return

    const wsUrl = import.meta.env.VITE_WS_URL
    if (!wsUrl) {
      throw new Error('VITE_WS_URL is not configured')
    }
    const socket = io(`${wsUrl}/messages`, {
      auth: { token },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('authenticate', { token, userId: user?.id, orgId: user?.orgId })
      socket.emit('join_deal_room', { dealId: id })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('message_history', (data: { dealId: string; messages: Message[] }) => {
      setMessages(data.messages)
    })

    socket.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })

    socket.on('user_typing', (data: { userId: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUsers((prev) => [...new Set([...prev, data.userId])])
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== data.userId))
      }
    })

    return () => {
      socket.emit('leave_deal_room', { dealId: id })
      socket.disconnect()
    }
  }, [id, token, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim() || !socketRef.current) return
    socketRef.current.emit('send_message', { dealId: id, content: inputValue.trim() })
    setInputValue('')
  }

  const handleTyping = () => {
    if (!socketRef.current) return
    socketRef.current.emit('typing', { dealId: id, isTyping: true })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { dealId: id, isTyping: false })
    }, 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in_progress': return <Clock className="w-4 h-4 text-amber-500" />
      default: return <Circle className="w-4 h-4 text-gray-300" />
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/deals" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{deal?.title || 'Deal Room'}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  deal?.status === 'active' && 'bg-green-100 text-green-700',
                  deal?.status === 'negotiating' && 'bg-amber-100 text-amber-700',
                )}>
                  {deal?.status}
                </span>
                <span>${deal?.totalValueUsd?.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-sm text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => {
            const isMine = msg.senderUserId === user?.id
            return (
              <div
                key={msg.id}
                className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
              >
                <div className={cn(
                  'max-w-md px-4 py-2.5 rounded-2xl',
                  isMine
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                )}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={cn(
                    'text-xs mt-1',
                    isMine ? 'text-primary-200' : 'text-gray-500'
                  )}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              Someone is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                handleTyping()
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 input"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="btn-primary px-4 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar - Deal Info */}
      <div className="w-80 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Deal Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Value</span>
              <span className="font-medium">${deal?.totalValueUsd?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Quantity</span>
              <span className="font-medium">{deal?.agreedQuantity?.toLocaleString()} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Price</span>
              <span className="font-medium">${deal?.agreedPrice}/unit</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Milestones</h3>
          <div className="space-y-3">
            {deal?.milestones?.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                {getStatusIcon(m.status)}
                <span className="text-sm flex-1 capitalize">{m.milestoneType.replace('_', ' ')}</span>
                {m.completedAt && (
                  <span className="text-xs text-gray-500">
                    {new Date(m.completedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )) || (
              <p className="text-sm text-gray-500">No milestones yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
