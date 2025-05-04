import { Navigate } from 'react-router-dom';
import { useAuth } from '../authContext';
import { useSubscription } from '../subscriptionContext';

export default function SubscriptionCheck({ children }) {
  const { currentUser } = useAuth();
  const { isSubscribed, loading } = useSubscription();

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!isSubscribed) {
    return <Navigate to="/subscribe" />;
  }

  return children;
} 