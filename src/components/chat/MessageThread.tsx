'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  channel: string;
  created_at: string;
  sender?: { full_name: string; role: string };
}

interface Props {
  projectId: string;
  currentUserId: string;
  currentUserRole: string;
  recipientId?: string;
  channelType: 'project' | 'direct' | 'admin_client' | 'admin_creator';
}

export function MessageThread({ projectId, currentUserId, currentUserRole, recipientId, channelType }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${projectId}-${channelType}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.channel === channelType) {
          setMessages((prev) => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, channelType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    let query = supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name, role)')
      .eq('project_id', projectId)
      .eq('channel', channelType)
      .order('created_at', { ascending: true });

    const { data } = await query;
    if (data) setMessages(data);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);

    const { error } = await supabase.from('messages').insert({
      project_id: projectId,
      sender_id: currentUserId,
      recipient_id: recipientId || null,
      channel: channelType,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwnMessage = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                  }`}>
                    {!isOwnMessage && msg.sender && (
                      <p className="mb-1 text-xs font-medium opacity-60">
                        {msg.sender.full_name}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`mt-1 text-xs ${isOwnMessage ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-500">Noch keine Nachrichten. Schreibe die erste!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <Button onClick={handleSend} loading={sending} size="sm" disabled={!newMessage.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
