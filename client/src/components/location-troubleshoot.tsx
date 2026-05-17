import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LocationTroubleshootProps {
  onLocationSuccess?: (coords: GeolocationCoordinates) => void;
}

export function LocationTroubleshoot({ onLocationSuccess }: LocationTroubleshootProps) {
  const { toast } = useToast();

  const testLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
      });
      return;
    }

    toast({
      title: "Testing Location",
      description: "Attempting to get your current location...",
    });

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast({
          title: "Location Test Successful",
          description: `Latitude: ${position.coords.latitude.toFixed(6)}, Longitude: ${position.coords.longitude.toFixed(6)}`,
        });
        if (onLocationSuccess) {
          onLocationSuccess(position.coords);
        }
      },
      (error) => {
        let errorMessage = "Location test failed";
        let description = "";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permission Denied";
            description = "Location access was denied. Please check your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Position Unavailable";
            description = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Request Timeout";
            description = "Location request timed out.";
            break;
          default:
            description = "An unknown error occurred.";
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
    <Card className="mt-4 border-amber-200 bg-amber-50">
      <CardContent className="p-4">
        <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          Location Troubleshooting
        </h4>
        
        <div className="space-y-3 text-sm text-amber-700">
          <div>
            <p className="font-medium mb-1">Common Issues & Solutions:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Permission Denied:</strong> Click the location icon in your browser's address bar and allow location access</li>
              <li><strong>Location Unavailable:</strong> Check if GPS/location services are enabled on your device</li>
              <li><strong>Timeout:</strong> Move to an area with better GPS signal (avoid indoors/tunnels)</li>
              <li><strong>Accuracy Issues:</strong> Wait a few moments for GPS to stabilize</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium mb-1">Browser-specific fixes:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Chrome:</strong> Settings → Privacy & Security → Site Settings → Location</li>
              <li><strong>Firefox:</strong> Address bar icon → Permissions → Location</li>
              <li><strong>Safari:</strong> Safari → Settings → Websites → Location</li>
              <li><strong>Mobile:</strong> Check app permissions in device settings</li>
            </ul>
          </div>
          
          <Button 
            onClick={testLocation}
            variant="outline"
            size="sm"
            className="w-full mt-3 border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            <i className="fas fa-location-dot mr-2"></i>
            Test Location Access
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}