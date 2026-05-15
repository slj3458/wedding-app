// src/App.jsx
import React, { useState } from 'react';
import './App.css';
import AdminPanel from './components/AdminPanel';
import Navigation from './components/Navigation';
import PhotoUpload from './components/PhotoUpload';
import PhotoGallery from './components/PhotoGallery';
import Guestbook from './components/Guestbook';
import CaricatureBooth from './components/CaricatureBooth';
import BackgroundSelector from './components/BackgroundSelector';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [activeSection, setActiveSection] = useState('photos'); // Default to photos
  const [background, setBackground] = useState('#7e1535');

  console.log('App - isAdmin:', isAdmin, 'adminToken:', adminToken);

  const handleAdminChange = (adminStatus, token) => {
    console.log('handleAdminChange called:', adminStatus, token);
    setIsAdmin(adminStatus);
    setAdminToken(token);
  };

  return (
    <div className="App" style={{ background, minHeight: '100vh' }}>
      {/* Background Selector */}
      {isAdmin && <BackgroundSelector onBackgroundChange={setBackground} />}

      <div style={styles.container}>
        <div style={styles.titleBar}>
          <h1 style={styles.mainTitle}>Ginger & Kyle</h1>
          <AdminPanel onAdminChange={handleAdminChange} />
        </div>

        {/* Navigation */}
        <Navigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Conditionally render sections based on active navigation */}
        {activeSection === 'photos' && (
          <div>
            <PhotoUpload />
            <PhotoGallery isAdmin={isAdmin} adminToken={adminToken} />
          </div>
        )}

        {activeSection === 'guestbook' && (
          <Guestbook isAdmin={isAdmin} adminToken={adminToken} />
        )}

        {activeSection === 'caricature' && <CaricatureBooth />}

        {activeSection === 'music' && (
          <div style={styles.comingSoon}>
            <h2>🎵 Music Jukebox</h2>
            <p>Coming Soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '480px',
    margin: '0 auto',
    padding: '20px',
  },
  titleBar: {
    position: 'relative',
    marginBottom: '30px',
  },
  mainTitle: {
    fontSize: '42px',
    color: 'white',
    textAlign: 'center',
    margin: 0,
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  comingSoon: {
    textAlign: 'center',
    padding: '100px 20px',
    color: 'white',
  },
};

export default App;
