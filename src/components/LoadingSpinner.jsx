// src/components/LoadingSpinner.jsx
const LoadingSpinner = () => {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="relative w-24 h-24 border-8 border-t-8 border-primary-500 rounded-full animate-spin3d">
          <div className="absolute inset-0 border-8 border-t-8 border-primary-500 rounded-full animate-spin3d-delay"></div>
        </div>
      </div>
    );
  };
  
  export default LoadingSpinner;
  