import  { useState, useEffect, useRef } from 'react';
import { HeartRateService } from '../services/heartRateService'; // Importing the HeartRateService
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bluetooth, BatteryChargingFull } from '@mui/icons-material';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HeartRateMonitor = () => {
  const [heartRate, setHeartRate] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [heartRateHistory, setHeartRateHistory] = useState([]);
  const heartRateServiceRef = useRef(null); // Ref to store HeartRateService instance

  useEffect(() => {
    heartRateServiceRef.current = new HeartRateService(); // Initialize HeartRateService

    if (heartRateServiceRef.current.isConnected()) {
      startHeartRateNotifications();
    }

    return () => {
      if (heartRateServiceRef.current.isConnected()) {
        heartRateServiceRef.current.disconnect();
      }
    };
  }, []);

  const startHeartRateNotifications = async () => {
    try {
      await heartRateServiceRef.current.connect();
      setIsConnected(true);
      heartRateServiceRef.current.setBatteryCallback(setBatteryLevel);
      await heartRateServiceRef.current.startNotifications((newHeartRate) => {
        setHeartRate(newHeartRate);
        setHeartRateHistory((prevHistory) => [
          ...prevHistory,
          { time: new Date().toISOString(), heartRate: newHeartRate }
        ]);
      });
    } catch (err) {
      setError('Failed to connect to heart rate monitor');
      console.error(err);
    }
  };

  const stopHeartRateNotifications = async () => {
    await heartRateServiceRef.current.disconnect();
    setIsConnected(false);
  };

  const heartRateZone = (rate) => {
    if (rate < 60) return 'Resting';
    if (rate < 100) return 'Fat Burn';
    if (rate < 140) return 'Cardio';
    return 'Peak';
  };

  const renderBattery = () => {
    return batteryLevel !== null ? (
      <div className="flex items-center">
        <BatteryChargingFull className="mr-2" />
        <span>{batteryLevel}%</span>
      </div>
    ) : (
      <span>Loading battery...</span>
    );
  };

  const renderHeartRateZone = () => {
    if (heartRate === null) return '--';
    const zone = heartRateZone(heartRate);
    return <span className={`text-${zone === 'Resting' ? 'blue' : zone === 'Fat Burn' ? 'yellow' : zone === 'Cardio' ? 'green' : 'red'}`}>{zone}</span>;
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Heart Rate Monitor</h2>
        <Button
          onClick={isConnected ? stopHeartRateNotifications : startHeartRateNotifications}
          className={`p-2 ${isConnected ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
        >
          <Bluetooth className="mr-2" />
          {isConnected ? 'Disconnect' : 'Connect'}
        </Button>
      </div>

      <div className="my-4">
        <p className="text-lg font-medium">Current Heart Rate:</p>
        <div className="text-2xl font-bold">{heartRate ? `${heartRate} BPM` : '-- BPM'}</div>
        <p className="mt-2">Zone: {renderHeartRateZone()}</p>
      </div>

      <div className="my-4">
        <p className="text-sm">Battery: {renderBattery()}</p>
      </div>

      <div className="my-6">
        <h3 className="text-lg font-medium">Heart Rate History</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={heartRateHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="heartRate" stroke="#8884d8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {error && (
        <div className="text-red-500 bg-red-100 p-2 rounded-md mt-4">
          {error}
        </div>
      )}
    </Card>
  );
};

export default HeartRateMonitor;
