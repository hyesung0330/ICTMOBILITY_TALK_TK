import React from 'react';
import './ToggleSwitch.css';

const ToggleSwitch = ({ isChecked, onChange }) => {
  return (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="slider"></span>
    </label>
  );
};

export default ToggleSwitch;