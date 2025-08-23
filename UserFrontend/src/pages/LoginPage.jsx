import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { HiEye, HiEyeSlash, HiEnvelope, HiLockClosed, HiUser } from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, login, register } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/scan" replace />;
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        if (!formData.name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        result = await register(formData.email, formData.password, formData.name);
      }

      if (!result.success) {
        setError(result.error);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="container-app flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Development Notice */}
        {(window.location.hostname !== 'localhost' && !window.location.hostname.includes('ngrok')) && (
          <div className="card bg-yellow-500/10 border-yellow-500/20 mb-6">
            <div className="text-center">
              <p className="text-yellow-400 text-sm font-medium mb-2">⚠️ Development Notice</p>
              <p className="text-xs text-gray-300">
                For authentication to work properly, please access the app via:
              </p>
              <p className="text-yellow-400 text-sm font-mono mt-1">
                http://localhost:3000 or your ngrok URL
              </p>
            </div>
          </div>
        )}

        {/* Ngrok Notice */}
        {window.location.hostname.includes('ngrok') && (
          <div className="card bg-blue-500/10 border-blue-500/20 mb-6">
            <div className="text-center">
              <p className="text-blue-400 text-sm font-medium mb-2">🌐 Ngrok Tunnel Active</p>
              <p className="text-xs text-gray-300">
                You're accessing the app via ngrok tunnel. Authentication may require CORS configuration in Appwrite.
              </p>
              <p className="text-blue-400 text-xs mt-1">
                Add this domain to your Appwrite project's platform settings.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-button rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🧭</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">NaviQ</h1>
          <p className="text-gray-400">AI-powered indoor navigation</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card-glass space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-400 text-sm">
                {isLogin 
                  ? 'Sign in to continue your navigation' 
                  : 'Join NaviQ to start navigating'
                }
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {!isLogin && (
              <div className="relative">
                <HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="input pl-12"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative">
              <HiEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="input pl-12"
                required
              />
            </div>

            <div className="relative">
              <HiLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="input pl-12 pr-12"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <HiEyeSlash /> : <HiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner mr-2"></div>
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
