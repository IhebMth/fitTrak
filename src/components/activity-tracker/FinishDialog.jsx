// src/components/ActivityTracking/FinishDialog.jsx
import PropTypes from 'prop-types';
import { Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const FinishDialog = ({ 
  isOpen, 
  onClose, 
  onResume, 
  onSave 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            onClick={onResume}
          >
            Resume
          </Button>
          <Button
            className="bg-primary-500 hover:bg-primary-600 text-white"
            onClick={onSave}
          >
            <Check className="h-4 w-4 mr-2" />
            Save Activity
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

FinishDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onResume: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default FinishDialog;