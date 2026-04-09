import { useState, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

interface GeocodingResult {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
  });

  const getCurrentPosition = useCallback(() => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            loading: false,
            error: null,
          });
          resolve(position);
        },
        (error) => {
          let errorMessage = 'Unable to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please allow location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setState({
            latitude: null,
            longitude: null,
            loading: false,
            error: errorMessage,
          });
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const reverseGeocode = useCallback((latitude: number, longitude: number) => {
    return new Promise<GeocodingResult>(async (resolve, reject) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Geocoding failed');
        }

        const data = await response.json();
        const address = data.address || {};

        const addressLine1 = [
          address.building,
          address.house_number,
          address.road,
          address.neighbourhood,
          address.suburb,
        ]
          .filter(Boolean)
          .join(', ');

        const addressLine2 = [address.landmark, address.commercial]
          .filter(Boolean)
          .join(', ');

        const city =
          address.city ||
          address.town ||
          address.village ||
          address.suburb ||
          address.locality ||
          '';
        const state = address.state || '';
        const pincode = address.postcode || '';

        resolve({
          addressLine1: addressLine1 || data.display_name?.split(',')[0] || '',
          addressLine2: addressLine2 || '',
          city,
          state,
          pincode,
        });
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        reject(new Error('Failed to get address from location'));
      }
    });
  }, []);

  const getLocationWithAddress = useCallback(async () => {
    const position = await getCurrentPosition();
    return await reverseGeocode(
      position.coords.latitude,
      position.coords.longitude
    );
  }, [getCurrentPosition, reverseGeocode]);

  return {
    ...state,
    getCurrentPosition,
    reverseGeocode,
    getLocationWithAddress,
  };
}
