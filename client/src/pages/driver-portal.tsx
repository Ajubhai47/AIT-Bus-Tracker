import { useState } from 'react';
import { DriverAuth } from '@/components/driver-auth';
import { DriverDashboard } from '@/components/driver-dashboard';

export default function DriverPortal() {
  const [driver, setDriver] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleLoginSuccess = (driverData: any, authToken: string) => {
    setDriver(driverData);
    setToken(authToken);
    localStorage.setItem('driver_token', authToken);
    localStorage.setItem('driver_data', JSON.stringify(driverData));
  };

  const handleLogout = () => {
    setDriver(null);
    setToken(null);
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver_data');
  };

  // Check for existing auth on component mount
  useState(() => {
    const savedToken = localStorage.getItem('driver_token');
    const savedDriver = localStorage.getItem('driver_data');
    
    if (savedToken && savedDriver) {
      try {
        setToken(savedToken);
        setDriver(JSON.parse(savedDriver));
      } catch (error) {
        console.error('Failed to parse saved driver data:', error);
        localStorage.removeItem('driver_token');
        localStorage.removeItem('driver_data');
      }
    }
  });

  if (driver && token) {
    return <DriverDashboard driver={driver} token={token} onLogout={handleLogout} />;
  }

  return <DriverAuth onLoginSuccess={handleLoginSuccess} />;
}
