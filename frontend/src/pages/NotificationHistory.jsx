import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import AuthContext from '../context/AuthContext';

const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

function statusClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (normalized === 'accepted') return 'bg-cyan-100 text-cyan-800 border-cyan-200';
  if (normalized === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (normalized === 'cancelled') return 'bg-rose-100 text-rose-800 border-rose-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function NotificationHistory() {
  const { token } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    async function loadHistory() {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/notification/history`, { headers: authHeaders });
        setHistory(response.data?.history || []);
      } catch (_error) {
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [token, authHeaders]);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Activity History</h1>
              <p className="mt-1 text-sm text-slate-600">
                Review emergency timelines and related chat messages in one place.
              </p>
            </div>

            <Link
              to="/dashboard"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>

        {isLoading ? (
          <section className="space-y-4">
            {[1, 2, 3].map((block) => (
              <div key={block} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-9/12 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="h-16 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-16 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-16 w-full animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {!isLoading && !history.length ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            No history yet. Your accepted/completed requests and chats will appear here.
          </section>
        ) : null}

        {!isLoading ? (
          <section className="grid grid-cols-1 gap-4">
            {history.map((entry) => {
              const request = entry.request || {};
              const messages = entry.messages || [];

              return (
                <article
                  key={request.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                        {request.emergency_type || 'Emergency'}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                          request.status
                        )}`}
                      >
                        {request.status || 'Unknown'}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        #{request.id}
                      </span>
                    </div>

                    <Link
                      to={`/emergency/${request.id}`}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 transition-all duration-200 hover:bg-blue-100"
                    >
                      Open Request
                    </Link>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-slate-700">{request.description}</p>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
                      <p className="mt-1 text-sm text-slate-800">
                        {entry.status_timeline?.created_at
                          ? new Date(entry.status_timeline.created_at).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accepted</p>
                      <p className="mt-1 text-sm text-slate-800">
                        {entry.status_timeline?.accepted_at
                          ? new Date(entry.status_timeline.accepted_at).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</p>
                      <p className="mt-1 text-sm text-slate-800">
                        {entry.status_timeline?.completed_at
                          ? new Date(entry.status_timeline.completed_at).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">Chat Summary</p>
                    <p className="mt-1 text-xs text-slate-500">Total messages: {messages.length}</p>
                    {messages.length ? (
                      <p className="mt-2 line-clamp-1 text-sm text-slate-700">
                        Last: {messages[messages.length - 1]?.content}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No chat messages.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}
      </div>
    </div>
  );
}