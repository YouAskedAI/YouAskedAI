import { useState } from 'react';
import { useAuth } from '../authContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import StripePayment from '../components/StripePayment';

export default function Subscribe() {
  const { currentUser } = useAuth();
  const [error, setError] = useState('');

  const handlePaymentSuccess = async (paymentMethodId) => {
    try {
      // Create subscription in your backend
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
          email: currentUser.email,
          userId: currentUser.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const { subscriptionId } = await response.json();

      // Update user's subscription status in Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        isSubscribed: true,
        subscriptionId,
        subscriptionStatus: 'active',
        lastPaymentDate: new Date(),
        plan: 'premium',
      }, { merge: true });

      // Redirect to the protected page
      window.location.href = '/course-solver';
    } catch (error) {
      setError('Error creating subscription: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Subscribe to YouAskedAI
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Get access to Course Solver and Tutor features
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">$8.99/month</h3>
              <p className="mt-2 text-gray-600">Cancel anytime</p>
            </div>

            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700">Access to Course Solver</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700">Access to Tutor</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700">Unlimited questions</p>
              </li>
            </ul>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <StripePayment
              onSuccess={handlePaymentSuccess}
              onError={(error) => setError(error)}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 