import React, { useState } from 'react';

const backgroundOptions = [
  {
    id: 'teal-purple',
    name: 'Teal Elegance',
    gradient: 'linear-gradient(135deg, #05878a 0%, #764ba2 100%)',
  },
  {
    id: 'navy-purple',
    name: 'Deep Ocean',
    gradient: 'linear-gradient(135deg, #074e67 0%, #764ba2 100%)',
  },
  {
    id: 'plum-purple',
    name: 'Royal Plum',
    gradient: 'linear-gradient(135deg, #5a175d 0%, #764ba2 100%)',
  },
  {
    id: 'magenta-purple',
    name: 'Berry Bliss',
    gradient: 'linear-gradient(135deg, #67074e 0%, #764ba2 100%)',
  },
  {
    id: 'gold-purple',
    name: 'Golden Sunset',
    gradient: 'linear-gradient(135deg, #dd9933 0%, #764ba2 100%)',
  },
];

function BackgroundSelector({ onBackgroundChange }) {
  const [selectedBg, setSelectedBg] = useState(backgroundOptions[2].id); // Default to Royal Plum
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    setSelectedBg(option.id);
    onBackgroundChange(option.gradient);
    setIsOpen(false);
  };

  const selectedOption = backgroundOptions.find(opt => opt.id === selectedBg);

  return (
    <div style={styles.container}>
      <label style={styles.label}>Background Theme:</label>
      <div style={styles.dropdown}>
        <button
          style={styles.dropdownButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div style={styles.selectedOption}>
            <div
              style={{
                ...styles.colorTile,
                background: selectedOption.gradient,
              }}
            />
            <span>{selectedOption.name}</span>
          </div>
          <span style={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
        </button>
        
        {isOpen && (
          <div style={styles.dropdownMenu}>
            {backgroundOptions.map((option) => (
              <button
                key={option.id}
                style={{
                  ...styles.dropdownItem,
                  ...(option.id === selectedBg ? styles.dropdownItemSelected : {}),
                }}
                onClick={() => handleSelect(option)}
              >
                <div
                  style={{
                    ...styles.colorTile,
                    background: option.gradient,
                  }}
                />
                <span>{option.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: '80px',
    right: '20px',
    zIndex: 1000,
  },
  label: {
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '8px',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
  },
  dropdown: {
    position: 'relative',
    minWidth: '200px',
  },
  dropdownButton: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid rgba(118, 75, 162, 0.5)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  selectedOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  arrow: {
    fontSize: '12px',
    color: '#764ba2',
  },
  colorTile: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    border: '2px solid rgba(0, 0, 0, 0.2)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '5px',
    background: 'rgba(255, 255, 255, 0.98)',
    border: '2px solid rgba(118, 75, 162, 0.5)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  dropdownItem: {
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s ease',
    textAlign: 'left',
  },
  dropdownItemSelected: {
    background: 'rgba(118, 75, 162, 0.1)',
  },
};

export default BackgroundSelector;
