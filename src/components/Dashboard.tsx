import React from 'react';
import { useOutletContext } from 'react-router-dom';
import DashboardGrid from './DashboardGrid';

interface OutletContext {
  setShowOnboarding: (show: boolean) => void;
}

const Dashboard: React.FC = () => {
  useOutletContext<OutletContext>();
  return <DashboardGrid />;
};

export default Dashboard;
