import React from 'react';
import PropTypes from 'prop-types';

const Switch = React.forwardRef(({ checked, onCheckedChange, className = "" }, ref) => {
  return (
    <button
      ref={ref}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full 
        transition-colors focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-offset-2 
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-blue-600' : 'bg-gray-200'} 
        ${className}
      `}
    >
      <span className="sr-only">Toggle switch</span>
      <span
        className={`
          ${checked ? 'translate-x-6' : 'translate-x-1'}
          inline-block h-4 w-4 transform rounded-full bg-white 
          transition-transform duration-200 ease-in-out
        `}
      />
    </button>
  );
});

Switch.displayName = 'Switch';

Switch.propTypes = {
  checked: PropTypes.bool.isRequired,
  onCheckedChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default Switch;
