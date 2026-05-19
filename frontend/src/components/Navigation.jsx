// src/components/Navigation.jsx
import React from 'react';

const Navigation = ({ activeSection, onSectionChange }) => {
  const sections = [
    { id: 'photos', label: 'Photos' },
    { id: 'guestbook', label: 'Guestbook' },
    { id: 'fun', label: 'Fun!', disabled: true },  // suppressed — caricature feature
    { id: 'music', label: 'Music', disabled: true },
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
            {section.label}
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
    width: '100%',
    display: 'flex',
    justifyContent: 'space-evenly',
    gap: '4px',
    padding: '12px 8px',
    boxSizing: 'border-box',
  },
  navButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 4px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#666',
    backgroundColor: 'transparent',
    border: '2px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
};

export default Navigation;
