import PropTypes from 'prop-types';
import { Card } from '@/components/ui/card';
import { BarChart2, Activity, Map, Award } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, change }) => {
  return (
    <Card className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {change && (
            <p
              className={`text-sm mt-1 ${
                change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {change >= 0 ? '+' : ''}
              {change}% from last month
            </p>
          )}
        </div>
        <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center shadow-inner">
          <Icon className="h-6 w-6 text-primary-500" />
        </div>
      </div>
    </Card>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  change: PropTypes.number
};

const RecentActivity = ({ activity }) => {
  return (
    <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
        <Activity className="h-5 w-5 text-primary-500" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{activity.title}</h4>
        <p className="text-sm text-gray-600">
          {activity.distance}km • {activity.duration} • {activity.date}
        </p>
      </div>
    </div>
  );
};

RecentActivity.propTypes = {
  activity: PropTypes.shape({
    title: PropTypes.string.isRequired,
    distance: PropTypes.number.isRequired,
    duration: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired
  }).isRequired
};

const Dashboard = () => {
  const mockStats = {
    totalDistance: { value: "156.2 km", change: 12.5 },
    totalActivities: { value: "24", change: -5.2 },
    avgPace: { value: "5:30 /km", change: 3.1 },
    achievements: { value: "8", change: 25.0 },
  };

  const mockActivities = [
    { title: "Morning Run", distance: 5.2, duration: "25:30", date: "Today, 8:30 AM" },
    { title: "Evening Jog", distance: 3.1, duration: "18:15", date: "Yesterday, 6:15 PM" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Track your fitness progress</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Distance" value={mockStats.totalDistance.value} icon={Map} change={mockStats.totalDistance.change} />
        <StatCard title="Activities" value={mockStats.totalActivities.value} icon={Activity} change={mockStats.totalActivities.change} />
        <StatCard title="Average Pace" value={mockStats.avgPace.value} icon={BarChart2} change={mockStats.avgPace.change} />
        <StatCard title="Achievements" value={mockStats.achievements.value} icon={Award} change={mockStats.achievements.change} />
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
        <div className="space-y-2">
          {mockActivities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{activity.title}</h4>
                <p className="text-sm text-gray-600">
                  {activity.distance}km • {activity.duration} • {activity.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
