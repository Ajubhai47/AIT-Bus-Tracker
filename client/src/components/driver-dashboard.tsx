import { useState, useEffect } from 'react';
import { websocketManager } from '@/lib/websocket';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LocationTroubleshoot } from './location-troubleshoot';
import { GoogleMaps } from './google-maps';

interface DriverDashboardProps {
  driver: {
    id: string;
    name: string;
    busId: string;
    route: string;
  };
  token: string;
  onLogout: () => void;
}

export function DriverDashboard({ driver, token, onLogout }: DriverDashboardProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast();

  // Check location permission status
  const checkLocationPermission = async () => {
    if (!navigator.permissions) {
      setPermissionStatus('unsupported');
      return;
    }
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(permission.state);
      
      permission.onchange = () => {
        setPermissionStatus(permission.state);
      };
    } catch (error) {
      console.error('Permission check failed:', error);
      setPermissionStatus('unknown');
    }
  };

  useEffect(() => {
    // Check location permission on mount
    checkLocationPermission();
    
    // Connect to WebSocket with authentication
    websocketManager.connect(token);

    const handleAuthenticated = (data: any) => {
      console.log('Driver authenticated for bus:', data.busId);
    };

    const handleAuthError = (data: any) => {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: data.message,
      });
    };

    websocketManager.on('authenticated', handleAuthenticated);
    websocketManager.on('auth_error', handleAuthError);

    return () => {
      websocketManager.off('authenticated', handleAuthenticated);
      websocketManager.off('auth_error', handleAuthError);
    };
  }, [token, toast]);

  const handleLocationUpdate = (coords: { latitude: number; longitude: number; accuracy: number }) => {
    // Update local state
    setCurrentLocation({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
    } as GeolocationCoordinates);
    
    setLastUpdate(new Date());
    
    // Send to WebSocket if tracking is active
    if (isTracking) {
      websocketManager.startTracking(coords.latitude, coords.longitude);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation Error",
        description: "Geolocation is not supported by this browser.",
      });
      return;
    }

    setIsTracking(true);
    setShowMap(true);
    
    toast({
      title: "Tracking Started",
      description: "Your bus location is now being tracked with HTML5 geolocation.",
    });
  };

  const stopTracking = () => {
    setIsTracking(false);
    websocketManager.stopTracking();
    
    toast({
      title: "Tracking Stopped",
      description: "Your bus is no longer being tracked.",
    });
  };

  const refreshLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation Error",
        description: "Geolocation is not supported by this browser.",
      });
      return;
    }

    // Show loading state
    toast({
      title: "Getting Location",
      description: "Please wait while we get your current location...",
    });

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout for refresh
      maximumAge: 0, // Force fresh location
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position.coords);
        setLastUpdate(new Date());
        
        if (isTracking) {
          websocketManager.startTracking(position.coords.latitude, position.coords.longitude);
        }
        
        toast({
          title: "Location Updated",
          description: "Current location has been refreshed.",
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = "Failed to get current location.";
        let description = "Please try again.";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location Access Denied";
            description = "Please enable location permissions in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location Unavailable";
            description = "Location information is unavailable. Please check your GPS.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location Timeout";
            description = "Location request timed out. Please try again.";
            break;
        }
        
        toast({
          variant: "destructive",
          title: errorMessage,
          description: description,
        });
      },
      options
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Driver Info Card */}
        <Card className="border border-border p-6 mb-6" data-testid="card-driver-info">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <i className="fas fa-user text-primary-foreground"></i>
              </div>
              <div>
                <h2 className="text-xl font-semibold" data-testid="text-driver-name">{driver.name}</h2>
                <p className="text-muted-foreground">
                  Bus ID: <span data-testid="text-bus-id">{driver.busId.toUpperCase()}</span> • Route: <span data-testid="text-route">{driver.route}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant={showMap ? "secondary" : "outline"}
                onClick={() => setShowMap(!showMap)}
                data-testid="button-toggle-map"
              >
                <i className={`fas ${showMap ? 'fa-list' : 'fa-map'} mr-2`}></i>
                {showMap ? 'Show Details' : 'Show Map'}
              </Button>
              <Button 
                variant="outline" 
                onClick={onLogout}
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>Logout
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Content - Map or Dashboard */}
        {showMap ? (
          <Card className="h-[600px] overflow-hidden">
            <CardContent className="p-0 h-full">
              <GoogleMaps
                buses={[]} // No other buses needed in driver mode
                showLiveLocation={isTracking}
                onLocationUpdate={handleLocationUpdate}
                driverMode={true}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tracking Controls */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              
              {/* Tracking Status */}
              <Card data-testid="card-tracking-status">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Tracking Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current Status:</span>
                      <span 
                        className={`px-3 py-1 text-sm rounded-full ${
                          isTracking 
                            ? 'bg-accent text-accent-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                        data-testid="status-tracking"
                      >
                        {isTracking ? 'Active' : 'Stopped'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Update:</span>
                      <span data-testid="text-last-update">
                        {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Location Permission:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        permissionStatus === 'granted' ? 'bg-green-100 text-green-800' :
                        permissionStatus === 'denied' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`} data-testid="status-permission">
                        {permissionStatus === 'granted' ? 'Granted' :
                         permissionStatus === 'denied' ? 'Denied' :
                         permissionStatus === 'prompt' ? 'Not Asked' :
                         'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Accuracy:</span>
                      <span data-testid="text-accuracy">
                        {currentLocation ? `±${currentLocation.accuracy?.toFixed(0)} meters` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Controls */}
              <Card data-testid="card-controls">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Controls</h3>
                  <div className="space-y-4">
                    {!isTracking ? (
                      <Button 
                        onClick={startTracking}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                        data-testid="button-start-tracking"
                      >
                        <i className="fas fa-play mr-2"></i>Start Live Tracking
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopTracking}
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-stop-tracking"
                      >
                        <i className="fas fa-stop mr-2"></i>Stop Tracking
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      onClick={refreshLocation}
                      className="w-full"
                      data-testid="button-refresh-location"
                    >
                      <i className="fas fa-sync-alt mr-2"></i>Refresh Location
                    </Button>
                    
                    {permissionStatus === 'denied' && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium mb-2">Location Permission Required</p>
                        <p className="text-xs text-red-700">
                          To enable location tracking, please:
                          <br />1. Click the location icon in your browser's address bar
                          <br />2. Select "Allow" for location access
                          <br />3. Refresh this page
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Location Info */}
            <Card data-testid="card-location-info">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Location Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Current Coordinates</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Latitude:</span>
                        <span data-testid="text-current-lat" className="font-mono">
                          {currentLocation ? `${currentLocation.latitude.toFixed(6)}° N` : 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Longitude:</span>
                        <span data-testid="text-current-lng" className="font-mono">
                          {currentLocation ? `${currentLocation.longitude.toFixed(6)}° E` : 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Altitude:</span>
                        <span data-testid="text-altitude">
                          {currentLocation?.altitude ? `${currentLocation.altitude.toFixed(0)} meters` : 'Not available'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Additional Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Speed:</span>
                        <span data-testid="text-speed">
                          {currentLocation?.speed ? `${(currentLocation.speed * 3.6).toFixed(1)} km/h` : 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Heading:</span>
                        <span data-testid="text-heading">
                          {currentLocation?.heading ? `${currentLocation.heading.toFixed(0)}°` : 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={isTracking ? 'text-accent' : 'text-muted-foreground'} data-testid="text-gps-status">
                          {isTracking ? 'HTML5 GPS Active' : 'GPS Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Location Troubleshoot - Show if permission denied or no location */}
        {(permissionStatus === 'denied' || (!currentLocation && !isTracking)) && (
          <LocationTroubleshoot 
            onLocationSuccess={(coords) => {
              setCurrentLocation(coords);
              setLastUpdate(new Date());
              toast({
                title: "Location Found",
                description: "You can now start tracking your bus location.",
              });
            }}
          />
        )}

      </div>
    </div>
  );
}
