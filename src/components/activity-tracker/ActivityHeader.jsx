// src/components/ActivityTracking/ActivityHeader.jsx
import PropTypes from 'prop-types';
import { Activity, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACTIVITY_TYPES = [
  { value: "running", label: "Running" },
  { value: "cycling", label: "Cycling" },
  { value: "walking", label: "Walking" },
  { value: "hiking", label: "Hiking" },
];

const ActivityHeader = ({ selectedActivity, onActivityChange }) => {
  return (
    <div className="bg-white shadow-sm px-4 py-2 flex justify-between items-center z-20">
      <Activity className="h-6 w-6 text-primary-500" />
      <div className="flex items-center space-x-2">
        <span className="font-semibold">Record</span>
        <div className="flex space-x-1">
          {ACTIVITY_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={selectedActivity === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => onActivityChange(type.value)}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>
      <Settings className="h-6 w-6 text-gray-600" />
    </div>
  );
};

ActivityHeader.propTypes = {
  selectedActivity: PropTypes.oneOf(ACTIVITY_TYPES.map(type => type.value)).isRequired,
  onActivityChange: PropTypes.func.isRequired,
};

export default ActivityHeader;