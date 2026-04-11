import { useState } from 'react';
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';

const defaultCenter = { lat: 23.8103, lng: 90.4125 };
const mapContainerClass = 'h-[420px] w-full rounded-2xl border border-slate-200';

export default function MapView({ requesterLocation, helpers = [], onLocationChange }) {
  const [selectedHelper, setSelectedHelper] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  if (loadError) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm text-rose-700">
        Unable to load Google Maps. Check VITE_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-600">
        Loading map...
      </div>
    );
  }

  const center = requesterLocation || defaultCenter;

  return (
    <GoogleMap
      mapContainerClassName={mapContainerClass}
      center={center}
      zoom={13}
      options={{ streetViewControl: false, mapTypeControl: false }}
      onClick={(event) => {
        if (!event.latLng || !onLocationChange) return;
        onLocationChange(event.latLng.lat(), event.latLng.lng());
      }}
    >
      {requesterLocation ? (
        <Marker
          position={requesterLocation}
          draggable
          onDragEnd={(event) => {
            if (!event.latLng || !onLocationChange) return;
            onLocationChange(event.latLng.lat(), event.latLng.lng());
          }}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          }}
          title="Requester location"
        />
      ) : null}

      {helpers.map((helper) => {
        const lat = Number(helper.latitude);
        const lng = Number(helper.longitude);

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          return null;
        }

        return (
          <Marker
            key={helper.id}
            position={{ lat, lng }}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            }}
            title={helper.name}
            onClick={() => setSelectedHelper(helper)}
          />
        );
      })}

      {selectedHelper ? (
        <InfoWindow
          position={{ lat: Number(selectedHelper.latitude), lng: Number(selectedHelper.longitude) }}
          onCloseClick={() => setSelectedHelper(null)}
        >
          <div className="max-w-[220px] p-1">
            <p className="text-sm font-semibold text-slate-900">{selectedHelper.name}</p>
            <p className="text-xs text-slate-600">Blood Group: {selectedHelper.blood_group || 'N/A'}</p>
            <p className="mt-1 text-xs text-slate-600">
              Skills:{' '}
              {Array.isArray(selectedHelper.skills) && selectedHelper.skills.length
                ? selectedHelper.skills.join(', ')
                : 'N/A'}
            </p>
          </div>
        </InfoWindow>
      ) : null}
    </GoogleMap>
  );
}
