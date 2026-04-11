import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import AuthContext from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import StatusTimeline from '../components/StatusTimeline';
import { socket } from '../socket';

const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

function badgeClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (normalized === 'accepted') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (normalized === 'completed') return 'bg-green-100 text-green-800 border-green-200';
  if (normalized === 'cancelled') return 'bg-rose-100 text-rose-800 border-rose-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isHelper, isRequester } = useContext(AuthContext);

  const [requestData, setRequestData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  async function fetchRequest() {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/emergency/${id}`, { headers });
      setRequestData(response.data?.request || null);
    } catch (_error) {
      setRequestData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!token || !id) {
      return;
    }

    fetchRequest();
  }, [token, id, headers]);

  useEffect(() => {
    if (!id) {
      return;
    }

    function onStatusUpdated(payload) {
      if (Number(payload?.request_id) !== Number(id)) {
        return;
      }
      fetchRequest();
    }

    socket.on('request_status_updated', onStatusUpdated);
    return () => {
      socket.off('request_status_updated', onStatusUpdated);
    };
  }, [id, headers]);

  async function runAction(path) {
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/emergency/${id}/${path}`, {}, { headers });
      await fetchRequest();
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-7 w-56 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="h-16 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-16 w-full animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="p-6">
        <p className="text-sm text-rose-600">Request not found or inaccessible.</p>
      </div>
    );
  }

  const status = String(requestData.status || '').toLowerCase();
  const showChat = isRequester ? status !== 'cancelled' : status === 'accepted' || status === 'completed';
  const helperCanDecide = isHelper && status === 'pending';
  const helperCanComplete = isHelper && status === 'accepted' && Number(requestData.helper?.id) === Number(user?.id);
  const helperCanCancel = isHelper && status === 'accepted' && Number(requestData.helper?.id) === Number(user?.id);
  const requesterCanCancel = isRequester && status === 'pending' && Number(requestData.requester?.id) === Number(user?.id);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {requestData.emergency_type}
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                  {requestData.urgency_level}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(
                    requestData.status
                  )}`}
                >
                  {requestData.status}
                </span>
              </div>

              <h1 className="text-xl font-bold text-slate-900">Emergency Request #{requestData.id}</h1>
              <p className="text-sm text-slate-700">{requestData.description}</p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requester</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{requestData.requester?.name || 'N/A'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Helper</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{requestData.helper?.name || 'Unassigned'}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {helperCanDecide ? (
              <>
                <button
                  onClick={() => runAction('accept')}
                  disabled={actionLoading}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:opacity-60"
                >
                  Accept
                </button>
                <button
                  onClick={() => runAction('reject')}
                  disabled={actionLoading}
                  className="rounded-xl bg-slate-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                >
                  Reject
                </button>
              </>
            ) : null}

            {helperCanComplete ? (
              <button
                onClick={() => runAction('complete')}
                disabled={actionLoading}
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:opacity-60"
              >
                Mark Complete
              </button>
            ) : null}

            {helperCanCancel ? (
              <button
                onClick={() => runAction('cancel')}
                disabled={actionLoading}
                className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 disabled:opacity-60"
              >
                Cancel Assignment
              </button>
            ) : null}

            {requesterCanCancel ? (
              <button
                onClick={() => runAction('cancel')}
                disabled={actionLoading}
                className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 disabled:opacity-60"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <StatusTimeline
              createdAt={requestData.created_at}
              acceptedAt={requestData.accepted_at}
              completedAt={requestData.completed_at}
              status={requestData.status}
            />
          </div>

          <div>
            {showChat ? (
              <ChatBox
                requestId={requestData.id}
                currentUserId={user?.id}
                token={token}
              />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                Chat will be available when this request is active.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
