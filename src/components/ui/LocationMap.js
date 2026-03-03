import React, { useState, useEffect } from 'react';
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MarkerPopup,
  MapControls
} from './Map';

const DEFAULT_LAT = 40.76;
const DEFAULT_LNG = -73.98;

/**
 * Geocode an address using Nominatim (OpenStreetMap). Returns { lat, lng } or null.
 * @param {string} address
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
async function geocodeAddress(address) {
  if (!address || typeof address !== 'string' || !address.trim()) return null;
  const q = address.trim();
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'PalmCafe/1.0' } }
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch (err) {
    console.warn('Geocoding failed for address:', q, err);
    return null;
  }
}

/**
 * Renders a small map with a single location marker for the footer.
 * Location is taken from cafe settings address (geocoded) or optional latitude/longitude.
 * @param {string} [address=''] - Cafe address from settings; used to geocode and center the map
 * @param {number} [latitude] - Optional override latitude (e.g. from API)
 * @param {number} [longitude] - Optional override longitude (e.g. from API)
 * @param {string} [locationName=''] - Name shown in tooltip and popup
 * @param {string} [className=''] - Wrapper class (e.g. for height)
 */
function LocationMap({
  address = '',
  latitude,
  longitude,
  locationName = '',
  className = ''
}) {
  const name = locationName || 'Location';
  const [coords, setCoords] = useState(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState(false);

  const hasExplicitCoords = latitude != null && longitude != null && !Number.isNaN(latitude) && !Number.isNaN(longitude);

  useEffect(() => {
    if (hasExplicitCoords) {
      setCoords({ lat: latitude, lng: longitude });
      setGeocodeLoading(false);
      setGeocodeError(false);
      return;
    }
    if (!address || !address.trim()) {
      setCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      setGeocodeLoading(false);
      setGeocodeError(false);
      return;
    }
    let cancelled = false;
    setGeocodeLoading(true);
    setGeocodeError(false);
    geocodeAddress(address).then((result) => {
      if (cancelled) return;
      setGeocodeLoading(false);
      if (result) {
        setCoords(result);
        setGeocodeError(false);
      } else {
        setCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        setGeocodeError(true);
      }
    });
    return () => { cancelled = true; };
  }, [address, hasExplicitCoords, latitude, longitude]);

  const lat = coords?.lat ?? latitude ?? DEFAULT_LAT;
  const lng = coords?.lng ?? longitude ?? DEFAULT_LNG;

  if (geocodeLoading) {
    return (
      <div className={`h-full min-h-[200px] flex items-center justify-center bg-[#E9E4DA] text-[#6F6A63] ${className}`.trim()}>
        <span className="text-sm">Loading location…</span>
      </div>
    );
  }

  return (
    <div className={`h-full min-h-[200px] ${className}`.trim()}>
      <Map center={[lng, lat]} zoom={14}>
        <MapMarker longitude={lng} latitude={lat}>
          <MarkerContent>
            <div className="size-4 rounded-full bg-[#C68E3C] border-2 border-white shadow-lg" />
          </MarkerContent>
          <MarkerTooltip>{name}</MarkerTooltip>
          <MarkerPopup>
            <div className="space-y-1">
              <p className="font-medium text-[#2A2A2A]">{name}</p>
              {address && (
                <p className="text-xs text-[#6F6A63]">{address}</p>
              )}
              <p className="text-xs text-[#6F6A63]">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </p>
            </div>
          </MarkerPopup>
        </MapMarker>
        <MapControls showZoom position="bottom-right" />
      </Map>
    </div>
  );
}

export default LocationMap;
