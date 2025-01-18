// src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import ActivityDetails from '../pages/ActivityDetails';
import Explore from '../pages/Explore';
import RecordActivity from '../pages/RecordActivity';
import NotFound from '../pages/NotFound';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/activity/:id" element={<ActivityDetails />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/record" element={<RecordActivity />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};