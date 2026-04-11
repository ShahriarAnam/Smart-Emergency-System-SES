import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import AuthContext from '../context/AuthContext';
import MapView from '../components/MapView';

const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const emergencyTypes = ['blood', 'ambulance', 'oxygen'];
const urgencyLevels = ['low', 'medium', 'high'];

export default function CreateEmergency() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [emergencyType, setEmergencyType] = useState('blood');
  const [description, setDescription] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('medium');
  const [requesterLocation, setRequesterLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('Detecting your location...');
  const [helpers, setHelpers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  async function reverseGeocode(lat, lng) {
    if (!GOOGLE_MAPS_API_KEY) {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          latlng: `${lat},${lng}`,
          key: GOOGLE_MAPS_API_KEY,
        },
      });

      const firstResult = response.data?.results?.[0]?.formatted_address;
      return firstResult || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (_error) {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  async function updateRequesterLocation(lat, lng) {
    setRequesterLocation({ lat, lng });
    const address = await reverseGeocode(lat, lng);
    setLocationAddress(address);
  }

  useEffect(() => {
    async function fetchHelpers() {
      try {
        const response = await axios.get(`${API_URL}/helper/available`);
        setHelpers(response.data?.helpers || []);
      } catch (_error) {
        setHelpers([]);
      }
    }

    fetchHelpers();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationAddress('Geolocation is not supported by your browser.');
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        await updateRequesterLocation(lat, lng);
        setIsDetecting(false);
      },
      () => {
        setLocationAddress('Could not auto-detect location. Please click on the map to set it.');
        setIsDetecting(false);
      }
    );
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!emergencyType || !description.trim() || !urgencyLevel || !requesterLocation) {
      toast.error('Please fill all required fields and select a location.');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(
        `${API_URL}/emergency/create`,
        {
          emergency_type: emergencyType,
          description: description.trim(),
          urgency_level: urgencyLevel,
          latitude: requesterLocation.lat,
          longitude: requesterLocation.lng,
        },
        { headers: authHeaders }
      );

      toast.success('Emergency request created successfully.');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create emergency request.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Create Emergency Request</h1>
          <p className="mt-1 text-sm text-slate-600">
            Share your emergency details and exact location so helpers can respond quickly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label htmlFor="emergency_type" className="mb-1 block text-sm font-medium text-slate-700">
                Emergency Type
              </label>
              <select
                id="emergency_type"
                value={emergencyType}
                onChange={(event) => setEmergencyType(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {emergencyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the emergency clearly..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-slate-700">Urgency Level</legend>
              <div className="flex flex-wrap gap-3">
                {urgencyLevels.map((level) => (
                  <label
                    key={level}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      urgencyLevel === level
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency_level"
                      value={level}
                      checked={urgencyLevel === level}
                      onChange={() => setUrgencyLevel(level)}
                      className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Detected Location</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {isDetecting ? 'Detecting your current location...' : locationAddress}
                  </p>
                  {requesterLocation ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {requesterLocation.lat.toFixed(6)}, {requesterLocation.lng.toFixed(6)}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      toast.error('Geolocation is not supported by your browser.');
                      return;
                    }

                    setIsDetecting(true);
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        await updateRequesterLocation(position.coords.latitude, position.coords.longitude);
                        setIsDetecting(false);
                      },
                      () => {
                        setIsDetecting(false);
                        toast.error('Could not detect your location. Please set it on the map.');
                      }
                    );
                  }}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700"
                >
                  Use Current Location
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Location Map</p>
              <MapView
                requesterLocation={requesterLocation}
                helpers={helpers}
                onLocationChange={async (lat, lng) => {
                  await updateRequesterLocation(lat, lng);
                }}
              />
              <p className="mt-2 text-xs text-slate-500">
                Click anywhere on the map or drag the red marker to set your exact location.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Submitting...' : 'Create Emergency'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
