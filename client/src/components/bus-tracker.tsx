import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoogleMaps } from './google-maps';
import { websocketManager } from '@/lib/websocket';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Bus {
  id: string;
  name: string;
  route: string;
  color: string;
  isActive: boolean;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    isTracking: boolean;
  };
}

export function BusTracker() {
  const [selectedBusId, setSelectedBusId] = useState<string>('ait1');
  const [busLocations, setBusLocations] = useState<Map<string, any>>(new Map());
  const [selectedRoute, setSelectedRoute] = useState<string>('all');

  const { data: buses = [], refetch } = useQuery<Bus[]>({
    queryKey: ['/api/buses'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    websocketManager.connect();

    const handleLocationUpdate = (data: any) => {
      setBusLocations(prev => {
        const newMap = new Map(prev);
        newMap.set(data.busId, {
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.timestamp,
          isTracking: true,
        });
        return newMap;
      });
    };

    const handleTrackingStopped = (data: any) => {
      setBusLocations(prev => {
        const newMap = new Map(prev);
        // Remove the bus location entirely when tracking stops
        newMap.delete(data.busId);
        return newMap;
      });
    };

    websocketManager.on('bus_location_update', handleLocationUpdate);
    websocketManager.on('bus_tracking_stopped', handleTrackingStopped);

    return () => {
      websocketManager.off('bus_location_update', handleLocationUpdate);
      websocketManager.off('bus_tracking_stopped', handleTrackingStopped);
    };
  }, []);

  // Merge real-time locations with bus data
  const busesWithRealTimeLocations = buses.map(bus => {
    const realtimeLocation = busLocations.get(bus.id);
    return {
      ...bus,
      // Prioritize real-time location over initial bus location
      location: realtimeLocation || bus.location,
    };
  });

  const selectedBus = busesWithRealTimeLocations.find(bus => bus.id === selectedBusId);

  const busMarkers = busesWithRealTimeLocations
    .filter(bus => bus.location?.isTracking)
    .filter(bus => selectedRoute === 'all' || bus.route === selectedRoute)
    .map(bus => ({
      busId: bus.id,
      name: bus.name,
      color: bus.color,
      latitude: bus.location!.latitude,
      longitude: bus.location!.longitude,
      isTracking: bus.location!.isTracking,
    }));

  const filteredBuses = selectedRoute === 'all' ? buses : buses.filter(bus => bus.route === selectedRoute);

  const groupedBuses = {
    'Bus Stand': filteredBuses.filter(bus => bus.route === 'Bus Stand'),
    'Vijaipura': filteredBuses.filter(bus => bus.route === 'Vijaipura'),
    'Kote': filteredBuses.filter(bus => bus.route === 'Kote'),
    'Hostel': filteredBuses.filter(bus => bus.route === 'Hostel'),
  };

  const routes = ['Bus Stand', 'Vijaipura', 'Kote', 'Hostel'];
  const activeBusCount = filteredBuses.filter(bus => {
    const realtimeLocation = busLocations.get(bus.id);
    // If real-time location exists, the bus is actively tracking
    return realtimeLocation?.isTracking || false;
  }).length;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" data-testid="text-bus-routes">Bus Routes</h2>
            <span className="text-sm bg-accent/10 text-accent px-2 py-1 rounded-full">
              {activeBusCount} active
            </span>
          </div>

          {/* Route Filter */}
          <div className="mb-6">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Filter by Route</label>
            <Select value={selectedRoute} onValueChange={setSelectedRoute}>
              <SelectTrigger data-testid="select-route-filter">
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                {routes.map(route => (
                  <SelectItem key={route} value={route}>{route}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Route Filter Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <Button
              variant={selectedRoute === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRoute('all')}
              data-testid="button-filter-all"
            >
              All ({buses.length})
            </Button>
            {routes.map(route => {
              const routeBuses = buses.filter(bus => bus.route === route);
              const activeRouteBuses = routeBuses.filter(bus => {
                const realtimeLocation = busLocations.get(bus.id);
                // If real-time location exists, the bus is actively tracking
                return realtimeLocation?.isTracking || false;
              });
              
              return (
                <Button
                  key={route}
                  variant={selectedRoute === route ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRoute(route)}
                  data-testid={`button-filter-${route.toLowerCase().replace(' ', '-')}`}
                  className="flex flex-col h-auto py-2"
                >
                  <span className="text-xs font-medium">{route}</span>
                  <span className="text-xs opacity-75">
                    {activeRouteBuses.length}/{routeBuses.length}
                  </span>
                </Button>
              );
            })}
          </div>
          
          <div className="space-y-4">
            {Object.entries(groupedBuses).map(([route, routeBuses]) => {
              if (routeBuses.length === 0) return null;
              
              return (
                <div key={route} className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{route}</h3>
                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                      {routeBuses.length} bus{routeBuses.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {routeBuses.map(bus => {
                      const realtimeLocation = busLocations.get(bus.id);
                      // If real-time location exists, the bus is actively tracking
                      const isTracking = realtimeLocation?.isTracking || false;
                      
                      return (
                        <div
                          key={bus.id}
                          className={`flex items-center justify-between p-2 bg-white rounded border hover:shadow-sm transition-shadow cursor-pointer ${
                            selectedBusId === bus.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedBusId(bus.id)}
                          data-testid={`button-select-bus-${bus.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-5 h-5 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: bus.color }}
                            ></div>
                            <span className="font-medium">{bus.name}</span>
                          </div>
                          <span className={`text-xs ${
                            isTracking ? 'text-accent' : 'text-muted-foreground'
                          }`} data-testid={`status-${bus.id}`}>
                            ● {isTracking ? 'Active' : 'Not started'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Bus Info */}
          {selectedBus && (
            <Card className="mt-6 border-accent/20" data-testid="card-selected-bus">
              <CardContent className="p-4 bg-accent/10">
                <h4 className="font-semibold text-accent mb-2">
                  Selected: {selectedBus.name}
                </h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Route:</span> {selectedBus.route}</p>
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={(() => {
                      const realtimeLocation = busLocations.get(selectedBus.id);
                      const isTracking = realtimeLocation?.isTracking || false;
                      return isTracking ? 'text-accent' : 'text-muted-foreground';
                    })()}>
                      {(() => {
                        const realtimeLocation = busLocations.get(selectedBus.id);
                        const isTracking = realtimeLocation?.isTracking || false;
                        return isTracking ? 'Active' : 'Not started';
                      })()}
                    </span>
                  </p>
                  {selectedBus.location?.timestamp && (
                    <p>
                      <span className="font-medium">Last Update:</span>{' '}
                      {new Date(selectedBus.location.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <GoogleMaps
          buses={busMarkers}
          selectedBusId={selectedBusId}
          onBusSelect={setSelectedBusId}
          showLiveLocation={true}
          driverMode={false}
        />

        {/* Map Controls */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
          <div className="flex flex-col space-y-2">
            <button 
              className="p-2 hover:bg-muted rounded transition-colors" 
              title="Refresh"
              onClick={() => refetch()}
              data-testid="button-refresh"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
            <button 
              className="p-2 hover:bg-muted rounded transition-colors" 
              title="Reset Filter"
              onClick={() => setSelectedRoute('all')}
              data-testid="button-reset-filter"
            >
              <i className="fas fa-filter"></i>
            </button>
          </div>
        </div>

        {/* Filter Status Overlay */}
        {selectedRoute !== 'all' && (
          <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center space-x-2">
              <i className="fas fa-filter text-sm"></i>
              <span className="text-sm font-medium">Showing: {selectedRoute}</span>
              <button 
                onClick={() => setSelectedRoute('all')}
                className="ml-2 hover:bg-white/20 rounded p-1"
                title="Clear filter"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
          </div>
        )}

        {/* Status Overlay */}
        {(() => {
          const realtimeLocation = selectedBus ? busLocations.get(selectedBus.id) : null;
          const isTracking = realtimeLocation?.isTracking || false;
          return selectedBus && isTracking && (
            <Card className="absolute bottom-4 left-4 max-w-sm shadow-lg" data-testid="card-bus-status">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-5 h-5 rounded-full border-2 border-white shadow-md animate-pulse"
                    style={{ backgroundColor: selectedBus.color }}
                  ></div>
                  <div>
                    <h4 className="font-semibold">{selectedBus.name} - {selectedBus.route} Route</h4>
                    <p className="text-sm text-muted-foreground">Currently tracking live location</p>
                    {selectedBus.location?.timestamp && (
                      <p className="text-xs text-accent">
                        Last updated: {new Date(selectedBus.location.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* No Tracking Message */}
        {(() => {
          const realtimeLocation = selectedBus ? busLocations.get(selectedBus.id) : null;
          const isTracking = realtimeLocation?.isTracking || false;
          return selectedBus && !isTracking && (
            <Card className="absolute bottom-4 left-4 max-w-sm shadow-lg" data-testid="card-no-tracking">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-5 h-5 rounded-full border-2 border-white shadow-md opacity-50"
                    style={{ backgroundColor: selectedBus.color }}
                  ></div>
                  <div>
                    <h4 className="font-semibold">{selectedBus.name} - {selectedBus.route} Route</h4>
                    <p className="text-sm text-muted-foreground">Not yet started</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </div>
  );
}