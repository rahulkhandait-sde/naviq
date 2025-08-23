import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import AIBot from '../components/AIBot';

const MapPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container-app p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Map</h1>
        <button
          onClick={() => navigate('/home')}
          className="btn btn-secondary"
        >
          Back to Home
        </button>
      </div>

      <MapView showNavigation={true} />
      <AIBot />
    </div>
  );
};

export default MapPage;
