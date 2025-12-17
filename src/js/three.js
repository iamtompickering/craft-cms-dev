import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PMREMGenerator } from 'three';

const threeModule = () => {

    const colours = {
        green: 0x65e2ca,
        blue: 0x7c8fff,
        yellow: 0xe4f59f,
        pink: 0xfe85db,
        white: 0xffffff,
    };

    // Constants
    const MODEL_MATERIAL_CONFIG = {
        color: colours.white,
        roughness: 0.0,
        metalness: 1.0,
    };

    const MODEL_ROTATION_SPEED = { y: 0.002 };

    // Helper functions
    const getWindowDimensions = () => ({
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio
    });

    const createLight = (config, targetScene) => {
        const { type, color, intensity, distance = 0, decay = 2, position } = config;
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(10, windowWidth / windowHeight, 1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    const pmremGenerator = new PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Environment scene
    const envScene = new THREE.Scene();

    // Ground
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshStandardMaterial({ color: colours.blue })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -400;
    envScene.add(ground);

    // Boxes
    const boxes = [
        { color: colours.green, position: [100, 20, 100], size: 50 },
        { color: colours.blue, position: [-50, 50, -100], size: 20 },
        { color: colours.pink, position: [-50, 50, -50], size: 20 },
        { color: colours.green, position: [0, -50, -100], size: 50 },
        { color: colours.pink, position: [0, 0, 200], size: 50 }
    ];

    boxes.forEach(({ color, position, size }) => {
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
        { type: 'PointLight', color: colours.green, intensity: 5.0, distance: 0, decay: 2, parent: 'camera' },
        { type: 'PointLight', color: colours.green, intensity: 4.0, distance: 0, decay: 2, position: [-100, -100, 100] },
        { type: 'DirectionalLight', color: colours.green, intensity: 2.0, position: [200, 200, 200] }
    ];

    lights.forEach(({ parent, ...config }) => {
        const light = createLight(config, parent === 'camera' ? camera : scene);
    });

    // Load model
    const loader = new GLTFLoader();
    let model = null;

    loader.load('/dist/tss.gltf', (gltf) => {
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshPhysicalMaterial({
                    ...MODEL_MATERIAL_CONFIG,
                    envMap: envMap
                });
            }
        });

        model = gltf.scene;
        scene.add(model);
    });

    // Setup camera and renderer
    setupCamera(camera, [-10, 10, 50], [0, 1, 0]);
    setupRenderer(renderer, windowWidth, windowHeight, pixelRatio);
    document.querySelector('.js-three-wrapper').appendChild(renderer.domElement);

    // Resize handler
    window.addEventListener('resize', () => {
        ({ width: windowWidth, height: windowHeight } = getWindowDimensions());
        renderer.setSize(windowWidth, windowHeight);
        camera.aspect = windowWidth / windowHeight;
        camera.updateProjectionMatrix();
    });

    let keyframe = 0;

    // Render loop
    const render = () => {
        requestAnimationFrame(render);
        keyframe += 0.001;
        if (model) {
            model.rotation.y += MODEL_ROTATION_SPEED.y;
            model.rotation.z += Math.cos(model.rotation.y) * 0.001;
            model.rotation.x += Math.sin(model.rotation.y) * 0.001;
        }

        boxes.forEach((box) => {
            // console.log(box);
        });

        renderer.render(scene, camera);
    };

    render();

}

export { threeModule };