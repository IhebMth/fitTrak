import PropTypes from 'prop-types';
import { Play, Square, PauseCircle, Flag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const ActivityControls = ({
  isTracking,
  isPaused,
  gpsSignal,
  onStart,
  onPause,
  onResume,
  onStop,
  onSplit,
  showFinishDialog,
  setShowFinishDialog,
  onFinish,
}) => {
  const renderStartButton = () => (
    <Button 
      onClick={onStart} 
      className="w-full bg-primary-500 text-white py-4 text-lg"
      disabled={gpsSignal.status !== "acquired"}
    >
      <Play className="mr-2" /> Start Activity
    </Button>
  );

  const renderActiveControls = () => (
    <div className="flex space-x-4">
      <Button
        onClick={onPause}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
      >
        <PauseCircle className="mr-2" /> Pause
      </Button>
      <Button
        onClick={onSplit}
        variant="outline"
        className="px-4"
      >
        <Flag className="h-4 w-4" />
      </Button>
      <Button
        onClick={onStop}
        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
      >
        <Square className="mr-2" /> Stop
      </Button>
    </div>
  );

  const renderResumeButton = () => (
    <Button 
      onClick={onResume} 
      className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4"
    >
      <Play className="mr-2" /> Resume
    </Button>
  );

  const renderFinishDialog = () => (
    <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finish Activity?</DialogTitle>
          <DialogDescription>
            Would you like to save or discard this activity?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowFinishDialog(false);
              onResume();
            }}
          >
            Resume
          </Button>
          <Button
            className="bg-primary-500 hover:bg-primary-600 text-white"
            onClick={onFinish}
          >
            <Check className="mr-2" />
            Save Activity
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-4">
      {!isTracking ? renderStartButton() : 
       !isPaused ? renderActiveControls() : 
       renderResumeButton()}
      {renderFinishDialog()}
    </div>
  );
};

ActivityControls.propTypes = {
  isTracking: PropTypes.bool.isRequired,
  isPaused: PropTypes.bool.isRequired,
  gpsSignal: PropTypes.shape({
    status: PropTypes.string.isRequired,
    accuracy: PropTypes.number
  }).isRequired,
  onStart: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onResume: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onSplit: PropTypes.func.isRequired,
  showFinishDialog: PropTypes.bool.isRequired,
  setShowFinishDialog: PropTypes.func.isRequired,
  onFinish: PropTypes.func.isRequired,
};

export default ActivityControls;