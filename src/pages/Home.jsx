import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Trophy,
  Users,
  Map,
  HeartPulse,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const [isHovered, setIsHovered] = useState(null);  // null to track which card is hovered

  const features = [
    {
      icon: Map,
      title: "Track Your Activities",
      description: "Record runs, rides, and other activities with precise GPS tracking"
    },
    {
      icon: HeartPulse,
      title: "Heart Rate Monitoring",
      description: "Keep track of your heart rate zones and performance metrics"
    },
    {
      icon: Trophy,
      title: "Set & Achieve Goals",
      description: "Challenge yourself with personal goals and achievements"
    },
    {
      icon: Users,
      title: "Connect & Share",
      description: "Join a community of athletes and share your progress"
    },
    {
      icon: Zap,
      title: "Performance Analytics",
      description: "Get detailed insights into your training and progress"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-bold mb-6"
              >
                Track. Achieve.
                <br />
                Connect.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg mb-8"
              >
                Join millions of athletes and achieve your fitness goals with our comprehensive tracking platform.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-x-4"
              >
                <Link 
                  to="/register"
                  className="bg-white text-primary-500 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </Link>
                <Link 
                  to="/explore"
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Explore
                </Link>
              </motion.div>
            </div>
            <div className="md:w-1/2">
              <motion.img 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                src="/api/placeholder/600/400"
                alt="Activity Tracking"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow ${isHovered === index ? 'bg-gradient-to-r from-primary-100 to-primary-200' : ''}`}
                onMouseEnter={() => setIsHovered(index)}
                onMouseLeave={() => setIsHovered(null)}
              >
                <feature.icon className="h-12 w-12 text-primary-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join our community of athletes and start tracking your progress today.
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-500 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Get Started <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
