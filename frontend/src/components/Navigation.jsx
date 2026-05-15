// src/components/Navigation.jsx
import React from 'react';

const Navigation = ({ activeSection, onSectionChange }) => {
  const sections = [
    { id: 'photos', label: '📸 Photos', icon: '📸' },
    { id: 'guestbook', label: '✍️ Guestbook', icon: '✍️' },
    { id: 'caricature', label: '🎨 Caricature', icon: '🎨' },
    { id: 'music', label: '🎵 Music', icon: '🎵', disabled: true }, // Disabled until we build it
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => !section.disabled && onSectionChange(section.id)}
            style={{
              ...styles.navButton,
              ...(activeSection === section.id ? styles.navButtonActive : {}),
              ...(section.disabled ? styles.navButtonDisabled : {}),
            }}
            disabled={section.disabled}
          >
            <span style={styles.icon}>{section.icon}</span>
            <span style={styles.label}>{section.label.split(' ')[1]}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    marginBottom: '30px',
  },
  container: {
    maxWidth: '480px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    gap: '4px',
    padding: '12px 8px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '10px 8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    backgroundColor: 'transparent',
    border: '2px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navButtonActive: {
    color: '#67074e',
    backgroundColor: 'rgba(103, 7, 78, 0.1)',
    borderColor: '#67074e',
  },
  navButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  icon: {
    fontSize: '20px',
  },
  label: {
    display: 'inline',
  },
  // Mobile responsive
  '@media (max-width: 600px)': {
    label: {
      display: 'none', // Hide text on mobile, keep icons only
    },
  },
};

export default Navigation;
