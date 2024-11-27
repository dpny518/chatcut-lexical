import './ColorPicker.css';
import * as React from 'react';

interface ColorPickerProps {
  color: string;
  onChange?: (value: string, skipHistoryStack: boolean) => void;
}

const basicColors = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
];

export default function ColorPicker({
  color,
  onChange,
}: Readonly<ColorPickerProps>): JSX.Element {
  return (
    <div className="color-picker-wrapper">
      <div className="color-picker-basic-color">
        {basicColors.map((basicColor) => (
          <button
            className={basicColor === color ? 'active' : ''}
            key={basicColor}
            style={{backgroundColor: basicColor}}
            onClick={() => onChange && onChange(basicColor, false)}
          />
        ))}
      </div>
    </div>
  );
}