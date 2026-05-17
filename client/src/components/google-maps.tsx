import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface BusMarker {
  busId: string;
  name: string;
  color: string;
  latitude: number;
  longitude: number;
  isTracking: boolean;
}

interface GoogleMapsProps {
  buses: BusMarker[];
  selectedBusId?: string;
  onBusSelect?: (busId: string) => void;
  showLiveLocation?: boolean;
  onLocationUpdate?: (coords: { latitude: number; longitude: number; accuracy: number }) => void;
  driverMode?: boolean;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyA8vR2AJk6H1XTmnMQ75dnzWUneeJ-e-kY';

export function GoogleMaps({
  buses,
  selectedBusId,
  onBusSelect,
  showLiveLocation = false,
  onLocationUpdate,
  driverMode = false
}: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const currentLocationMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // HTML5 Geolocation Functions - Based on your provided script
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      alert('Geolocation is not supported by this browser.');
      return;
    }

    const options = {
      enableHighAccuracy: true, // Request the most accurate position possible
      timeout: 10000,          // Maximum time (ms) to wait for a position
      maximumAge: 0           // Don't use a cached position
    };

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;

      const newLocation = { lat: latitude, lng: longitude };
      setCurrentLocation(newLocation);
      setLocationAccuracy(accuracy);

      // Notify parent component
      if (onLocationUpdate) {
        onLocationUpdate({ latitude, longitude, accuracy });
      }

      // Update map if it exists
      if (map) {
        updateCurrentLocationOnMap(newLocation, accuracy);

        // Center map on current location in driver mode
        if (driverMode) {
          map.panTo(newLocation);
        }
      }

      console.log(`Live location updated: ${latitude}, ${longitude} (±${accuracy}m)`);
    };

    const error = (err: GeolocationPositionError) => {
      let errorMessage = '';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable';
          break;
        case err.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
        default:
          errorMessage = 'An unknown error occurred';
          break;
      }
      console.warn(`Geolocation ERROR(${err.code}): ${errorMessage}`);
      alert(`Error getting location: ${errorMessage}`);
    };

    // Start watching position - using navigator.geolocation.watchPosition()
    watchIdRef.current = navigator.geolocation.watchPosition(success, error, options);
    console.log('Started live location tracking with HTML5 watchPosition');
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log('Stopped live location tracking');
    }
  };

  const updateCurrentLocationOnMap = (location: { lat: number; lng: number }, accuracy: number) => {
    if (!map) return;

    // Remove existing current location marker and accuracy circle
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
    }
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }

    // Create current location marker (blue pulsing dot)
    currentLocationMarkerRef.current = new window.google.maps.Marker({
      position: location,
      map: map,
      title: `Your Live Location (±${accuracy.toFixed(0)}m)`,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: '#4285F4', // Google blue
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        scale: 8,
      },
      zIndex: 1000, // Ensure it's on top
      animation: window.google.maps.Animation.BOUNCE // Add animation
    });

    // Create accuracy circle
    accuracyCircleRef.current = new window.google.maps.Circle({
      strokeColor: '#4285F4',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#4285F4',
      fillOpacity: 0.1,
      map: map,
      center: location,
      radius: accuracy
    });
  };

  useEffect(() => {
    // Load Google Maps API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      window.initGoogleMaps = () => {
        setIsLoaded(true);
      };

      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 13.0827, lng: 77.5877 }, // Bangalore coordinates
        zoom: 13,
        styles: [
          {
            featureType: "poi",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
      setMap(googleMap);
    }
  }, [isLoaded, map]);

  // Start/stop location tracking based on showLiveLocation prop
  useEffect(() => {
    if (map && showLiveLocation) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    // Cleanup on unmount
    return () => {
      stopLocationTracking();
    };
  }, [map, showLiveLocation]);

  useEffect(() => {
    if (map && buses) {
      // Clear existing bus markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();

      // Add new bus markers
      buses.forEach(bus => {
        if (bus.latitude && bus.longitude && bus.isTracking) {
          const marker = new window.google.maps.Marker({
            position: { lat: bus.latitude, lng: bus.longitude },
            map: map,
            title: `${bus.name} - ${bus.isTracking ? 'Active' : 'Not tracking'}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: bus.color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 10,
            }
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold">${bus.name}</h3>
                <p class="text-sm text-gray-600">Status: ${bus.isTracking ? 'Active' : 'Not tracking'}</p>
                <p class="text-xs text-gray-500">Route: ${bus.name.replace('AIT', '')}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            if (onBusSelect) {
              onBusSelect(bus.busId);
            }
            infoWindow.open(map, marker);
          });

          markersRef.current.set(bus.busId, marker);

          // Highlight selected bus
          if (selectedBusId === bus.busId) {
            marker.setIcon({
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: bus.color,
              fillOpacity: 1,
              strokeColor: '#000000',
              strokeWeight: 4,
              scale: 12,
            });
            map.panTo({ lat: bus.latitude, lng: bus.longitude });
          }
        }
      });
    }
  }, [map, buses, selectedBusId, onBusSelect]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-map-marked-alt text-primary-foreground text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold mb-2">Loading Google Maps</h3>
          <p className="text-muted-foreground">Please wait...</p>
          {showLiveLocation && (
            <p className="text-sm text-blue-600 mt-2">
              📍 Live location tracking will start automatically
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" data-testid="google-map" />

      {/* Live Location Status Overlay - Similar to your HTML example */}
      {showLiveLocation && currentLocation && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs border-l-4 border-blue-500">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-blue-700">Your Live Location</span>
          </div>
          <div className="text-xs text-gray-700 space-y-1">
            <p>Latitude: <span className="font-mono">{currentLocation.lat.toFixed(6)}</span></p>
            <p>Longitude: <span className="font-mono">{currentLocation.lng.toFixed(6)}</span></p>
            {locationAccuracy && (
              <p>Accuracy: <span className="font-mono">±{locationAccuracy.toFixed(0)} meters</span></p>
            )}
          </div>
          <div className="text-xs text-green-600 mt-2 flex items-center">
            <i className="fas fa-broadcast-tower mr-1"></i>
            Live tracking active
          </div>
        </div>
      )}
    </div>
  );
}