import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './authContext';
import { SubscriptionProvider } from './subscriptionContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CourseSolver from './pages/CourseSolver';
import Tutor from './pages/Tutor';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Subscribe from './pages/Subscribe';
import SubscriptionCheck from './components/SubscriptionCheck';
import { useAuth } from './authContext';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected routes requiring subscription */}
                <Route
                  path="/course-solver"
                  element={
                    <PrivateRoute>
                      <SubscriptionCheck>
                        <CourseSolver />
                      </SubscriptionCheck>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/tutor"
                  element={
                    <PrivateRoute>
                      <SubscriptionCheck>
                        <Tutor />
                      </SubscriptionCheck>
                    </PrivateRoute>
                  }
                />

                {/* Subscription page */}
                <Route
                  path="/subscribe"
                  element={
                    <PrivateRoute>
                      <Subscribe />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App; 