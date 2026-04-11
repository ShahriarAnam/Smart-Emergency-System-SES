import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

import { joinRoom, leaveRoom, sendMessage, socket } from '../socket';

const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatBox({ requestId, currentUserId, token }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sendError, setSendError] = useState('');
  const endRef = useRef(null);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  useEffect(() => {
    if (!requestId || !token) {
      return;
    }

    async function loadHistory() {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/notification/messages/${requestId}`, {
          headers,
        });
        setMessages(response.data?.messages || []);
      } catch (_error) {
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    }

    joinRoom(requestId);
    loadHistory();

    function onReceiveMessage(message) {
      if (!message || Number(message.request_id) !== Number(requestId)) {
        return;
      }

      setMessages((prev) => [...prev, message]);
    }

    socket.on('receive_message', onReceiveMessage);

    return () => {
      leaveRoom(requestId);
      socket.off('receive_message', onReceiveMessage);
    };
  }, [requestId, token, headers]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(event) {
    event.preventDefault();
    setSendError('');

    const content = draft.trim();
    if (!content) {
      return;
    }

    const senderId = Number(currentUserId);
    if (Number.isNaN(senderId) || senderId <= 0) {
      setSendError('Could not identify your account for chat. Please log in again.');
      return;
    }

    sendMessage(Number(requestId), senderId, content);
    setDraft('');
  }

  return (
    <section className="flex h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Live Chat</h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-14 w-7/12 animate-pulse rounded-2xl bg-slate-200" />
            <div className="ml-auto h-14 w-6/12 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-14 w-8/12 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        ) : null}
        {!isLoading && !messages.length ? <p className="text-sm text-slate-500">No messages yet.</p> : null}

        {messages.map((message) => {
          const mine = Number(message.sender_id) === Number(currentUserId);
          return (
            <div
              key={message.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  mine
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-800'
                }`}
              >
                <p className={`text-[11px] font-semibold ${mine ? 'text-blue-100' : 'text-slate-500'}`}>
                  {message.sender_name || 'User'}
                </p>
                <p className="mt-0.5 break-words">{message.content}</p>
                <p className={`mt-1 text-[11px] ${mine ? 'text-blue-100' : 'text-slate-500'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>

      {sendError ? (
        <p className="px-3 pb-3 text-xs font-medium text-rose-600">{sendError}</p>
      ) : null}
    </section>
  );
}
