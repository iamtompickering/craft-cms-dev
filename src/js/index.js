import Alpine from 'alpinejs';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

import { threeModule } from './three';

threeModule();

// Components

// Global
window.Alpine = Alpine;
window.THREE = THREE;
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
window.ScrollToPlugin = ScrollToPlugin;

// Inits
Alpine.start();