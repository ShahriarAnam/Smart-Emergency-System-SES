import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Clock3, FileCheck2, Filter } from 'lucide-react';

import AuthContext from '../context/AuthContext';
import AvailabilityToggle from '../components/AvailabilityToggle';
import { socket } from '../socket';

const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

const TYPE_ICON = {
  blood: '🩸',
  ambulance: '🚑',
  oxygen: '💨',
  fire: '🔥',
  medical: '🏥',
  security: '🔒',
};

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (s === 'accepted') return 'bg-blue-600 text-white border-blue-600';
  if (s === 'completed') return 'bg-emerald-600 text-white border-emerald-600';
  if (s === 'cancelled') return 'bg-rose-600 text-white border-rose-600';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function urgencyStyle(urgency) {
  const u = String(urgency || '').toLowerCase();
  if (u === 'high') {
    return {
      leftBorder: 'border-l-rose-500',
      dot: 'bg-rose-500',
      text: 'text-rose-700',
    };
  }
  if (u === 'medium') {
    return {
      leftBorder: 'border-l-orange-500',
      dot: 'bg-orange-500',
      text: 'text-orange-700',
    };
  }
  return {
    leftBorder: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
  };
}

function emergencyTypeLabel(type) {
  const normalized = String(type || '').toLowerCase();
  const icon = TYPE_ICON[normalized] || '🆘';
  const text = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Emergency';
  return `${icon} ${text}`;
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <span className={`rounded-lg p-2 ${color}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user, token, isHelper, isRequester } = useContext(AuthContext);

  const [requesterRequests, setRequesterRequests] = useState([]);
  const [helperPoolRequests, setHelperPoolRequests] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState({});

  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  async function fetchRequesterRequests() {
    const response = await axios.get(`${API_URL}/emergency/my`, { headers: authHeaders });
    setRequesterRequests(response.data.requests || []);
  }

  async function fetchHelperPoolRequests() {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (dateFilter) params.set('date', dateFilter);

    const response = await axios.get(`${API_URL}/emergency/all?${params.toString()}`, {
      headers: authHeaders,
    });

    setHelperPoolRequests(response.data.requests || []);
  }

  async function fetchAssignedTasks() {
    const response = await axios.get(`${API_URL}/emergency/my`, { headers: authHeaders });
    setAssignedTasks(response.data.requests || []);
  }

  async function bootstrapData() {
    setIsLoading(true);
    try {
      if (isRequester) {
        await fetchRequesterRequests();
      }

      if (isHelper) {
        await Promise.all([fetchHelperPoolRequests(), fetchAssignedTasks()]);
      }
    } catch (_error) {
      // Keep UI stable on transient API failures.
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!token || !user) return;
    bootstrapData();
  }, [token, user, isRequester, isHelper, statusFilter, typeFilter, dateFilter]);

  useEffect(() => {
    if (!token || !user) return;

    function onRequestStatusUpdated() {
      if (isRequester) fetchRequesterRequests();
      if (isHelper) {
        fetchHelperPoolRequests();
        fetchAssignedTasks();
      }
    }

    function onNewEmergencyRequest(payload) {
      if (!isHelper) return;
      const incoming = payload?.request;
      if (!incoming) return;

      setHelperPoolRequests((prev) => {
        const exists = prev.some((item) => item.id === incoming.id);
        if (exists) return prev;
        return [incoming, ...prev];
      });
    }

    socket.on('request_status_updated', onRequestStatusUpdated);
    socket.on('new_emergency_request', onNewEmergencyRequest);

    return () => {
      socket.off('request_status_updated', onRequestStatusUpdated);
      socket.off('new_emergency_request', onNewEmergencyRequest);
    };
  }, [token, user, isRequester, isHelper, statusFilter, typeFilter, dateFilter]);

  async function handleAccept(requestId) {
    setIsActionLoading((prev) => ({ ...prev, [`accept-${requestId}`]: true }));
    try {
      await axios.put(`${API_URL}/emergency/${requestId}/accept`, {}, { headers: authHeaders });
      await Promise.all([fetchHelperPoolRequests(), fetchAssignedTasks()]);
    } catch (_error) {
      // Keep UI stable.
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [`accept-${requestId}`]: false }));
    }
  }

  async function handleReject(requestId) {
    setIsActionLoading((prev) => ({ ...prev, [`reject-${requestId}`]: true }));
    try {
      await axios.put(`${API_URL}/emergency/${requestId}/reject`, {}, { headers: authHeaders });
      setHelperPoolRequests((prev) => prev.filter((item) => item.id !== requestId));
    } catch (_error) {
      // Keep UI stable.
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [`reject-${requestId}`]: false }));
    }
  }

  async function handleComplete(requestId) {
    setIsActionLoading((prev) => ({ ...prev, [`complete-${requestId}`]: true }));
    try {
      await axios.put(`${API_URL}/emergency/${requestId}/complete`, {}, { headers: authHeaders });
      await Promise.all([fetchAssignedTasks(), fetchHelperPoolRequests()]);
    } catch (_error) {
      // Keep UI stable.
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [`complete-${requestId}`]: false }));
    }
  }

  async function handleCancelAssigned(requestId) {
    setIsActionLoading((prev) => ({ ...prev, [`cancel-${requestId}`]: true }));
    try {
      await axios.put(`${API_URL}/emergency/${requestId}/cancel`, {}, { headers: authHeaders });
      await Promise.all([fetchAssignedTasks(), fetchHelperPoolRequests()]);
    } catch (_error) {
      // Keep UI stable.
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [`cancel-${requestId}`]: false }));
    }
  }

  const stats = useMemo(() => {
    if (isRequester) {
      return {
        pending: requesterRequests.filter((r) => String(r.status).toLowerCase() === 'pending').length,
        accepted: requesterRequests.filter((r) => String(r.status).toLowerCase() === 'accepted').length,
        completed: requesterRequests.filter((r) => String(r.status).toLowerCase() === 'completed').length,
      };
    }

    return {
      pending: helperPoolRequests.filter((r) => String(r.status).toLowerCase() === 'pending').length,
      accepted: assignedTasks.filter((r) => String(r.status).toLowerCase() === 'accepted').length,
      completed: assignedTasks.filter((r) => String(r.status).toLowerCase() === 'completed').length,
    };
  }, [isRequester, requesterRequests, helperPoolRequests, assignedTasks]);

  const listForCards = isRequester ? requesterRequests : helperPoolRequests;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Coordination Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor emergency requests, coordinate helper actions, and track live status updates.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<Clock3 size={18} className="text-yellow-700" />}
          color="bg-yellow-100"
        />
        <StatCard
          title="Accepted"
          value={stats.accepted}
          icon={<CheckCircle2 size={18} className="text-blue-700" />}
          color="bg-blue-100"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<FileCheck2 size={18} className="text-emerald-700" />}
          color="bg-emerald-100"
        />
      </section>

      {isHelper ? <AvailabilityToggle /> : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter size={16} />
          Filters
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Types</option>
            <option value="blood">Blood</option>
            <option value="ambulance">Ambulance</option>
            <option value="oxygen">Oxygen</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading requests...
        </div>
      ) : null}

      {!isLoading ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {listForCards.map((item) => {
            const urgency = urgencyStyle(item.urgency_level);
            const status = String(item.status || '').toLowerCase();
            const canAccept = isHelper && status === 'pending';
            const canReject = isHelper && status === 'pending';

            return (
              <article
                key={item.id}
                className={`rounded-xl border border-slate-200 border-l-4 ${urgency.leftBorder} bg-white p-4 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{emergencyTypeLabel(item.emergency_type)}</p>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <p className="text-sm text-slate-700">{item.description}</p>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${urgency.dot}`} />
                    <span className={urgency.text}>Urgency: {item.urgency_level}</span>
                  </div>
                  <p>
                    Location: {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                  </p>
                  <p>Created: {new Date(item.created_at).toLocaleString()}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Request #{item.id}</span>
                  <Link
                    to={`/emergency/${item.id}`}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700"
                  >
                    Open
                  </Link>
                </div>

                {canAccept || canReject ? (
                  <div className="mt-3 flex gap-2">
                    {canAccept ? (
                      <button
                        onClick={() => handleAccept(item.id)}
                        disabled={Boolean(isActionLoading[`accept-${item.id}`])}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:opacity-60"
                      >
                        {isActionLoading[`accept-${item.id}`] ? 'Accepting...' : 'Accept'}
                      </button>
                    ) : null}

                    {canReject ? (
                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={Boolean(isActionLoading[`reject-${item.id}`])}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 disabled:opacity-60"
                      >
                        {isActionLoading[`reject-${item.id}`] ? 'Rejecting...' : 'Reject'}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : null}

      {!isLoading && !listForCards.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No emergency requests found for current filters.
        </div>
      ) : null}

      {isHelper ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">My Assigned Tasks</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assignedTasks.map((task) => {
              const urgency = urgencyStyle(task.urgency_level);
              const status = String(task.status || '').toLowerCase();
              return (
                <article
                  key={task.id}
                  className={`rounded-xl border border-slate-200 border-l-4 ${urgency.leftBorder} bg-white p-4 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{emergencyTypeLabel(task.emergency_type)}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(task.status)}`}>
                      {task.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700">{task.description}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      to={`/emergency/${task.id}`}
                      className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200"
                    >
                      View
                    </Link>

                    {status === 'accepted' ? (
                      <button
                        onClick={() => handleComplete(task.id)}
                        disabled={Boolean(isActionLoading[`complete-${task.id}`])}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:opacity-60"
                      >
                        {isActionLoading[`complete-${task.id}`] ? 'Completing...' : 'Complete'}
                      </button>
                    ) : null}

                    {status === 'accepted' ? (
                      <button
                        onClick={() => handleCancelAssigned(task.id)}
                        disabled={Boolean(isActionLoading[`cancel-${task.id}`])}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 disabled:opacity-60"
                      >
                        {isActionLoading[`cancel-${task.id}`] ? 'Cancelling...' : 'Cancel'}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          {!assignedTasks.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              You have no assigned tasks yet.
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
