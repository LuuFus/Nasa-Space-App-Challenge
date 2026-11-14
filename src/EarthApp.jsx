import GlobeView from './ui/GlobeView.jsx';
import Toolbar from './ui/Toolbar.jsx';
import Sidebar from './ui/Sidebar.jsx';
import ConsentPrompt from './ui/ConsentPrompt.jsx';

export default function EarthApp() {
  return (
    <div className="app">
      <Toolbar />
      <div className="main">
        <Sidebar />
        <GlobeView />
      </div>
      <ConsentPrompt />
    </div>
  );
}
