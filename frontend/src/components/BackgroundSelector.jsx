import React, { useState } from 'react';

const backgroundOptions = [
  { id: 'garnet',    name: 'Garnet',    value: '#7e1535' },
  { id: 'burgundy',  name: 'Burgundy',  value: '#a41e43' },
  { id: 'claret',    name: 'Claret',    value: '#5c1028' },
  { id: 'rose-gold', name: 'Rose Gold', value: '#c98a7b' },
  { id: 'blush',     name: 'Blush',     value: '#f9dde2' },
];

function BackgroundSelector({ onBackgroundChange }) {
  const [selectedBg, setSelectedBg] = useState(backgroundOptions[0].id); // Default to Garnet
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    setSelectedBg(option.id);
    onBackgroundChange(option.value);
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
                background: selectedOption.value,
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
                    background: option.value,
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
    border: '2px solid rgba(126, 21, 53, 0.5)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    color: 'black',
  },
  selectedOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  arrow: {
    fontSize: '12px',
    color: 'black',
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
    border: '2px solid rgba(126, 21, 53, 0.5)',
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
    color: 'black',
  },
  dropdownItemSelected: {
    background: 'rgba(126, 21, 53, 0.1)',
  },
};

export default BackgroundSelector;
