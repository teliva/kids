import './components/kd-button';
import './components/kd-loader';
import './components/kd-tooltip';
import './components/kd-spinner';
import './components/kd-toast';
import './components/kd-input';
import './components/kd-switch';

import { getHoverTintColor } from './utils/tint-color'

const root = document.documentElement

const primaryColor = getComputedStyle(root)
  .getPropertyValue('--kd-primary-color')
  .trim()

root.style.setProperty(
  '--kd-primary-hover',
  getHoverTintColor(primaryColor, 'var(--kd-primary-color)'),
)