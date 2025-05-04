import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

const Landing: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to AI Calendar
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Your intelligent calendar assistant powered by AI
          </p>
          
          {user ? (
            <Link
              to="/calendar"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Calendar
            </Link>
          ) : (
            <div className="space-x-4">
              <Link
                to="/login"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Smart Scheduling</h3>
            <p className="text-gray-600">
              Let AI help you find the perfect time for your meetings and events.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Intelligent Reminders</h3>
            <p className="text-gray-600">
              Never miss an important event with smart reminders and notifications.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Seamless Integration</h3>
            <p className="text-gray-600">
              Works with your existing calendar and productivity tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing; 