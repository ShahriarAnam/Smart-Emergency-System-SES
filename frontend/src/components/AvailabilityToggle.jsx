import { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import AuthContext from '../context/AuthContext';
import { socket } from '../socket';

const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

export default function AvailabilityToggle() {
  const { user, token } = useContext(AuthContext);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    async function fetchAvailability() {
      try {
        const response = await axios.get(`${API_URL}/helper/profile`, { headers: authHeaders });
        const helper = response.data?.helper;

        if (helper) {
          setIsAvailable(Boolean(helper.is_available));
          setLastUpdated(new Date());
        }
      } catch (_error) {
        // Non-blocking UI behavior: silently keep default state.
      }
    }

    fetchAvailability();
  }, [token, authHeaders]);

  useEffect(() => {
    function onAvailabilityUpdated(payload) {
      // Update local state only when broadcast matches current logged-in helper.
      if (payload?.helper_id !== user?.id) {
        return;
      }

      setIsAvailable(Boolean(payload?.is_available));
      setLastUpdated(new Date());
    }

    socket.on('helper_availability_updated', onAvailabilityUpdated);

    // Cleanup listener when component unmounts.
    return () => {
      socket.off('helper_availability_updated', onAvailabilityUpdated);
    };
  }, [user?.id]);

  async function handleToggle() {
    setIsLoading(true);

    try {
      const response = await axios.put(
        `${API_URL}/helper/toggle-availability`,
        {},
        { headers: authHeaders }
      );

      // Update local state immediately for responsive UX.
      setIsAvailable(Boolean(response.data?.is_available));
      setLastUpdated(new Date());
    } catch (_error) {
      // Non-blocking UI behavior: state remains unchanged on failure.
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Availability</h3>
          <p className="text-sm text-slate-600">Set your live helper status for incoming emergencies</p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {isAvailable ? 'Available' : 'Offline'}
        </span>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className="group relative inline-flex h-14 w-28 items-center rounded-full bg-slate-300 p-1 transition-all duration-300 ease-out disabled:opacity-60"
      >
        <span
          className={`absolute inset-0 rounded-full transition-colors duration-300 ${
            isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        />
        <span
          className={`relative z-10 block h-12 w-12 rounded-full bg-white shadow-lg transition-transform duration-300 ${
            isAvailable ? 'translate-x-14' : 'translate-x-0'
          }`}
        />
      </button>

      <div className="mt-4 space-y-1">
        <p className={`text-sm font-semibold ${isAvailable ? 'text-emerald-700' : 'text-slate-600'}`}>
          {isLoading ? 'Updating status...' : isAvailable ? 'Available' : 'Offline'}
        </p>
        <p className="text-xs text-slate-500">
          Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Not synced yet'}
        </p>
      </div>
    </section>
  );
}
