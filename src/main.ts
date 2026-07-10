import './components/kd-button';
import './components/kd-progress-bar';
import './components/kd-tooltip';

import { getHoverTintColor } from './utils/tint-color'

const root = document.documentElement

const primaryColor = getComputedStyle(root)
  .getPropertyValue('--kd-primary-color')
  .trim()

root.style.setProperty(
  '--kd-primary-hover',
  getHoverTintColor(primaryColor, 'var(--kd-primary-color)'),
)