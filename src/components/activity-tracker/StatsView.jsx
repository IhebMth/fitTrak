import PropTypes from 'prop-types';
import { Maximize2 } from "lucide-react";

const ActivityStats = ({
  distance,
  duration,
  averagePace,
  isExpanded,
  onToggleExpansion,
  formatDuration,
  formatPace
}) => {
  return (
    <div className="relative">
      <button 
        onClick={onToggleExpansion} 
        className="absolute top-2 right-2 p-2"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      <div className={`grid ${isExpanded ? 'grid-cols-3' : 'grid-cols-1'} gap-4 p-4 bg-gray-50`}>
        <div className="text-center">
          <div className="text-3xl font-bold">{(distance / 1000).toFixed(2)}</div>
          <div className="text-xs text-gray-500 uppercase">Distance (km)</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{formatDuration(duration)}</div>
          <div className="text-xs text-gray-500 uppercase">Time</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{formatPace(averagePace)}</div>
          <div className="text-xs text-gray-500 uppercase">Avg Pace</div>
        </div>
      </div>
    </div>
  );
};

ActivityStats.propTypes = {
  distance: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  averagePace: PropTypes.number,
  isExpanded: PropTypes.bool.isRequired,
  onToggleExpansion: PropTypes.func.isRequired,
  formatDuration: PropTypes.func.isRequired,
  formatPace: PropTypes.func.isRequired
};

export default ActivityStats;