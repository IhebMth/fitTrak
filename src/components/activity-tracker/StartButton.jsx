// components/activity-tracker/StartButton.jsx
import PropTypes from 'prop-types';
import { Play } from 'lucide-react';
import { Button } from "@/components/ui/button";

const StartButton = ({ onStart, disabled, gpsStatus }) => {
    const isGpsReady = gpsStatus === "acquired" || gpsStatus === "good" || gpsStatus === "acceptable";
    
    return (
      <Button
        onClick={onStart}
        className="w-full bg-primary-500 text-white py-4 text-lg"
        disabled={disabled || !isGpsReady}
      >
        <Play className="mr-2" />
        {isGpsReady ? "Start Activity" : "Waiting for GPS..."}
      </Button>
    );
  };
StartButton.propTypes = {
    onStart: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    gpsStatus: PropTypes.oneOf(['searching', 'acquired', 'lost']).isRequired
  };
export default StartButton;