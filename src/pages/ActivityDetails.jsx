import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Award, 
  Clock, 
  Target, 
  ArrowUp,
  MapPin,
  Zap,
} from 'lucide-react';

const ActivityCard = ({ activity }) => {
  const [isHovered, setIsHovered] = useState(false);

  // 3D rotation animation using Framer Motion
  const hoverVariants = {
    initial: {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
    },
    hovered: {
      rotateX: 5,
      rotateY: 5,
      scale: 1.02,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1 },
    },
  };

  const statItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="initial"
      animate={isHovered ? 'hovered' : 'initial'}
      variants={hoverVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full bg-white rounded-xl shadow-lg overflow-hidden"
    >
      <div className="relative">
        {/* Activity Image/Map Preview */}
        <div className="h-48 bg-gray-200 relative overflow-hidden">
          <img 
            src={activity.imageUrl || '/api/placeholder/400/200'} 
            alt={activity.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Activity Type Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-4 bg-primary-500 text-white px-3 py-1 rounded-full 
                       flex items-center space-x-2"
          >
            <Target className="h-4 w-4" />
            <span className="text-sm font-medium">{activity.type}</span>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{activity.title}</h3>
              <p className="text-sm text-gray-600 mt-1 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {format(new Date(activity.date), 'PPp')}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="bg-primary-50 p-2 rounded-full text-primary-500 
                         hover:bg-primary-100 transition-colors"
            >
              <Award className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Stats Grid */}
          <motion.div
            variants={statsVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-4 mb-6"
          >
            <motion.div variants={statItemVariants} className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MapPin className="h-4 w-4 text-primary-500 mr-1" />
                <span className="text-sm text-gray-600">Distance</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{activity.distance} km</p>
            </motion.div>

            <motion.div variants={statItemVariants} className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Zap className="h-4 w-4 text-primary-500 mr-1" />
                <span className="text-sm text-gray-600">Pace</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{activity.pace}/km</p>
            </motion.div>

            <motion.div variants={statItemVariants} className="text-center">
              <div className="flex items-center justify-center mb-1">
                <ArrowUp className="h-4 w-4 text-primary-500 mr-1" />
                <span className="text-sm text-gray-600">Elevation</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{activity.elevation}m</p>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-500"
            >
              <Heart className="h-5 w-5" />
              <span className="text-sm">{activity.likes}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-500"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{activity.comments}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-500"
            >
              <Share2 className="h-5 w-5" />
              <span className="text-sm">Share</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

ActivityCard.propTypes = {
  activity: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    distance: PropTypes.number.isRequired,
    pace: PropTypes.string.isRequired,
    elevation: PropTypes.number.isRequired,
    likes: PropTypes.number.isRequired,
    comments: PropTypes.number.isRequired,
    imageUrl: PropTypes.string,
  }).isRequired,
};

export default ActivityCard;
