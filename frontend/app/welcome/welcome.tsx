import { Link } from "react-router";

export function Welcome() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full text-center space-y-8 md:space-y-12">
        {/* Hero Section */}
        <div className="space-y-4 md:space-y-6">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            MoneyLens
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 font-light tracking-wide">
            Track expenses with clarity
          </p>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Take control of your finances with intelligent expense tracking,
            insightful analytics, and beautiful visualizations.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 md:pt-8">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-semibold text-indigo-600 bg-white border-2 border-indigo-600 rounded-full hover:bg-indigo-50 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-8 md:pt-16 px-4">
          <div className="space-y-2 md:space-y-3">
            <div className="text-4xl md:text-5xl">📊</div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800">
              Smart Analytics
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              Visualize spending patterns with interactive charts
            </p>
          </div>
          <div className="space-y-2 md:space-y-3">
            <div className="text-4xl md:text-5xl">💰</div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800">
              Easy Tracking
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              Record expenses effortlessly in seconds
            </p>
          </div>
          <div className="space-y-2 md:space-y-3">
            <div className="text-4xl md:text-5xl">🎯</div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800">
              Set Goals
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              Stay on budget with personalized targets
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
