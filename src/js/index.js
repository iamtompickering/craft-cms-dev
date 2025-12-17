import Alpine from 'alpinejs';
import * as THREE from 'three';

import { threeModule } from './three';

threeModule();

// Components

// Global
window.Alpine = Alpine;
window.THREE = THREE;

// Inits
Alpine.start();