// src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { RequireAuth, RequireNoAuth } from '../middleware/authMiddleware';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import ActivityDetails from '../pages/ActivityDetails';
import Explore from '../pages/Explore';
import RecordActivity from '../pages/RecordActivity';
import NotFound from '../pages/NotFound';
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        
        <Route element={<RequireNoAuth />}>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="activity/:id" element={<ActivityDetails />} />
          <Route path="explore" element={<Explore />} />
          <Route path="record" element={<RecordActivity />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};