// src/components/ActivityTracking/GpsStatus.jsx
import PropTypes from 'prop-types';
import { MapPin, Signal, AlertCircle } from 'lucide-react';

const statusIcons = {
  searching: <MapPin className="text-yellow-500" />,
  acquired: <Signal className="text-green-500" />,
  lost: <AlertCircle className="text-primary-500" />
};

const statusMessages = {
  searching: "Searching for GPS",
  acquired: "GPS Signal Strong",
  lost: "GPS Signal Lost"
};

const GpsStatus = ({ status, accuracy }) => {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-full px-3 py-2 shadow-md flex items-center space-x-2">
      {statusIcons[status]}
      <span className="text-sm">{statusMessages[status]}</span>
      {accuracy && <span className="text-xs text-gray-500">±{accuracy.toFixed(0)}m</span>}
    </div>
  );
};

GpsStatus.propTypes = {
  status: PropTypes.oneOf(['searching', 'acquired', 'lost']).isRequired,
  accuracy: PropTypes.number
};

export default GpsStatus;