"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useMemo, useRef, useState } from "react";

type Value = { lat: number | null; lng: number | null };

type AddressPayload = {
  formattedAddress?: string | null;
  city?: string | null;
  province?: string | null; // 2 lettere (FI, MI, ...)
};

type Props = {
  apiKey: string;
  value: Value;
  onChange: (v: Value) => void;
  onAddress?: (a: AddressPayload) => void;
  className?: string;
};

let mapsLoaderConfigured = false;

function pickCity(components?: google.maps.GeocoderAddressComponent[] | null) {
  if (!components || components.length === 0) return null;

  const byType = (t: string) => components.find((c) => c.types?.includes(t))?.long_name ?? null;

  return (
    byType("locality") ||
    byType("postal_town") ||
    byType("administrative_area_level_3") ||
    byType("sublocality") ||
    byType("sublocality_level_1") ||
    null
  );
}

function pickProvince(components?: google.maps.GeocoderAddressComponent[] | null) {
  if (!components || components.length === 0) return null;
  const prov = components.find((c) => c.types?.includes("administrative_area_level_2"));
  const short = (prov?.short_name || "").trim().toUpperCase();
  if (short.length === 2) return short;
  if (short.length > 2) return short.slice(0, 2);
  return null;
}

export default function LocationPicker({ apiKey, value, onChange, onAddress, className }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const defaultCenter = useMemo(() => {
    return { lat: 43.769562, lng: 11.255814 };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        setLoadErr(null);

        if (!apiKey) {
          setLoadErr("Manca NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
          return;
        }

        if (!mapsLoaderConfigured) {
          setOptions({
            key: apiKey,
            v: "weekly",
            region: "IT",
            language: "it",
          });
          mapsLoaderConfigured = true;
        }

        await Promise.all([importLibrary("maps"), importLibrary("places")]);

        if (cancelled) return;

        const el = mapDivRef.current;
        if (!el) return;

        const center =
          value.lat != null && value.lng != null
            ? { lat: value.lat, lng: value.lng }
            : defaultCenter;

        const map = new google.maps.Map(el, {
          center,
          zoom: value.lat != null && value.lng != null ? 16 : 12,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });

        mapRef.current = map;

        const marker = new google.maps.Marker({
          map,
          position: center,
          draggable: true,
        });

        markerRef.current = marker;

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = Number(e.latLng.lat().toFixed(6));
          const lng = Number(e.latLng.lng().toFixed(6));
          marker.setPosition({ lat, lng });
          onChange({ lat, lng });
        });

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (!pos) return;
          const lat = Number(pos.lat().toFixed(6));
          const lng = Number(pos.lng().toFixed(6));
          onChange({ lat, lng });
        });

        const input = inputRef.current;
        if (input) {
          const ac = new google.maps.places.Autocomplete(input, {
            fields: ["geometry", "formatted_address", "address_components", "name"],
            componentRestrictions: { country: "it" },
          });

          autocompleteRef.current = ac;

          ac.addListener("place_changed", () => {
            const place = ac.getPlace();
            const loc = place?.geometry?.location;
            if (!loc) return;

            const lat = Number(loc.lat().toFixed(6));
            const lng = Number(loc.lng().toFixed(6));

            map.panTo({ lat, lng });
            map.setZoom(16);
            marker.setPosition({ lat, lng });

            onChange({ lat, lng });

            if (onAddress) {
              const components = place.address_components ?? null;
              const city = pickCity(components);
              const province = pickProvince(components);

              onAddress({
                formattedAddress: place.formatted_address ?? place.name ?? null,
                city,
                province,
              });
            }
          });
        }

        setReady(true);
      } catch {
        setLoadErr("Non riesco a caricare Google Maps. Controlla API key o rete.");
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [apiKey, defaultCenter, onChange, onAddress, value.lat, value.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    if (value.lat == null || value.lng == null) {
      map.panTo(defaultCenter);
      map.setZoom(12);
      marker.setPosition(defaultCenter);
      return;
    }

    const pos = { lat: value.lat, lng: value.lng };
    marker.setPosition(pos);
    map.panTo(pos);
    map.setZoom(16);
  }, [value.lat, value.lng, defaultCenter]);

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-zinc-900">
        Cerca via / luogo (consigliato)
      </label>

      <input
        ref={inputRef}
        className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        placeholder="Es. Via Roma 10, Firenze"
        disabled={!ready && !loadErr}
      />

      {loadErr ? (
        <p className="mt-2 text-sm text-red-700">{loadErr}</p>
      ) : (
        <p className="mt-2 text-xs text-zinc-600">
          Suggerimento: cerca un indirizzo, poi trascina il pin nel punto esatto.
        </p>
      )}

      <div
        ref={mapDivRef}
        className="mt-4 h-72 w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
      />
    </div>
  );
}