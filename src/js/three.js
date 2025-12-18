import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const threeModule = () => {

    const wrapper = document.querySelector('.js-three-wrapper');
    if (!wrapper) return;

    const colours = {
        green: 0x65e2ca,
        blue: 0x7c8fff,
        yellow: 0xe4f59f,
        pink: 0xfe85db,
        white: 0xffffff,
    };

    // Helper functions

    const getWindowDimensions = () => ({
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio
    });

    const createLight = (config, targetScene) => {
        const { type, color, intensity, distance = 0, decay = 1, position } = config;
        let light;

        switch (type) {
            case 'AmbientLight':
                light = new THREE.AmbientLight(color, intensity);
                break;
            case 'PointLight':
                light = new THREE.PointLight(color, intensity, distance, decay);
                if (position) light.position.set(...position);
                break;
            case 'DirectionalLight':
                light = new THREE.DirectionalLight(color, intensity);
                if (position) light.position.set(...position);
                break;
        }

        if (light) targetScene.add(light);
        return light;
    };

    const setupRenderer = (renderer, width, height, pixelRatio) => {
        renderer.setClearColor('#000000');
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
    };

    const setupCamera = (camera, position, lookAt) => {
        camera.position.set(...position);
        camera.lookAt(...lookAt);
    };

    // Initialize
    let { width: windowWidth, height: windowHeight, pixelRatio } = getWindowDimensions();

    // Setup scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(8, windowWidth / windowHeight, 1, 2000);
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
    });

    // Setup controls
    new OrbitControls(camera, renderer.domElement);

    // Setup PMREM generator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Environment scene
    const envScene = new THREE.Scene();

    // Boxes
    const boxesConfig = [
        { color: colours.green, position: [75, 20, 100], size: 50 },
        { color: colours.blue, position: [-50, 50, -100], size: 20 },
        { color: colours.pink, position: [20, 50, -50], size: 30 },
        { color: colours.green, position: [0, -50, -100], size: 50 },
        { color: colours.pink, position: [0, 0, 200], size: 50 }
    ];

    boxesConfig.forEach(({ color, position, size }) => {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshStandardMaterial({ color })
        );
        box.position.set(...position);
        envScene.add(box);
    });

    // Environment lights
    const envLights = [
        { type: 'AmbientLight', color: 0xffffff, intensity: 2.0 }
    ];
    envLights.forEach(config => createLight(config, envScene));

    const envMap = pmremGenerator.fromScene(envScene).texture;
    pmremGenerator.dispose();

    // Scene lights
    const lights = [
        { type: 'DirectionalLight', color: colours.green, intensity: 2.0, position: [200, 200, 200] }
    ];

    lights.forEach(({ parent, ...config }) => {
        createLight(config, parent === 'camera' ? camera : scene);
    });

    // Load model
    const loader = new GLTFLoader();
    let model = null;

    loader.load('/models/tss.gltf', (gltf) => {
        gltf.scene.traverse((child) => {
            child.material = new THREE.MeshPhysicalMaterial({
                color: colours.white,
                roughness: 0.2,
                metalness: 1.5,
                envMap: envMap
            });
        });

        model = gltf.scene;
        model.position.set(2.5, -1.5, 0);
        scene.add(model);

    });

    // Setup camera and renderer
    setupCamera(camera, [-25, 10, 50], [0, 0, 0]);

    // Setup renderer
    setupRenderer(renderer, windowWidth, windowHeight, pixelRatio);
    wrapper.appendChild(renderer.domElement);

    // Setup post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Resize handler
    window.addEventListener('resize', () => {

        ({ width: windowWidth, height: windowHeight, pixelRatio } = getWindowDimensions());

        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(windowWidth, windowHeight);

        camera.aspect = windowWidth / windowHeight;
        camera.updateProjectionMatrix();
        composer.setSize(windowWidth, windowHeight);

    });

    let keyframe = 0;
    const wobbleAmount = 0.0002;

    // Render loop
    const render = () => {
        requestAnimationFrame(render);
        keyframe += 0.01;

        const sin = Math.sin(keyframe) * wobbleAmount;
        const cos = Math.cos(keyframe) * wobbleAmount;
        model.rotation.y += sin;
        model.rotation.z += cos;
        model.rotation.x += sin;
        model.position.y += sin;

        composer.render();
    };

    render();

};

export { threeModule };