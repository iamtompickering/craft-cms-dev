import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PMREMGenerator } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import GUI from 'lil-gui';

const threeModule = () => {

    const gui = new GUI();

    const colours = {
        green: 0x65e2ca,
        blue: 0x7c8fff,
        yellow: 0xe4f59f,
        pink: 0xfe85db,
        white: 0xffffff,
    };

    // const gui = new GUI();

    // Constants
    const MODEL_MATERIAL_CONFIG = {
        color: colours.white,
        roughness: 0.2,
        metalness: 1.5,
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(8, windowWidth / windowHeight, 1, 2000);
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
    });

    const controls = new OrbitControls(camera, renderer.domElement);

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
    const boxesConfig = [
        { color: colours.green, position: [75, 20, 100], size: 50 },
        { color: colours.blue, position: [-50, 50, -100], size: 20 },
        { color: colours.pink, position: [20, 50, -50], size: 30 },
        { color: colours.green, position: [0, -50, -100], size: 50 },
        { color: colours.pink, position: [0, 0, 200], size: 50 }
    ];

    const boxes = [];
    boxesConfig.forEach(({ color, position, size }) => {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshStandardMaterial({ color })
        );
        box.position.set(...position);
        box.userData.originalPosition = [...position];
        envScene.add(box);
        boxes.push(box);
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
    let modelGuiFolder = null;

    // const addModelToGui = (loadedModel) => {
    //     if (modelGuiFolder) return;

    //     modelGuiFolder = gui.addFolder('Model');



    //     const positionFolder = modelGuiFolder.addFolder('Position');
    //     positionFolder.add(loadedModel.position, 'x', -5, 5, 0.01).name('x').listen();
    //     positionFolder.add(loadedModel.position, 'y', -3, 3, 0.01).name('y').listen();
    //     positionFolder.add(loadedModel.position, 'z', -30, 30, 0.01).name('z').listen();

    //     const rotationFolder = modelGuiFolder.addFolder('Rotation');
    //     rotationFolder.add(loadedModel.rotation, 'x', -Math.PI / 3, Math.PI / 3, 0.01).name('x').listen();
    //     rotationFolder.add(loadedModel.rotation, 'y', -Math.PI / 3, Math.PI / 3, 0.01).name('y').listen();
    //     rotationFolder.add(loadedModel.rotation, 'z', -Math.PI / 3, Math.PI / 3, 0.01).name('z').listen();
    // };

    loader.load('/models/tss.gltf', (gltf) => {
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshPhysicalMaterial({
                    ...MODEL_MATERIAL_CONFIG,
                    envMap: envMap
                });
            }
        });

        model = gltf.scene;
        model.position.x = 2.5;
        model.position.y = -1.5;
        // model.position.z = 15;
        // model.rotation.x = -0.0771975511965977;
        // model.rotation.y = 0.552802448803402;
        // model.rotation.z = 0.392802448803402;

        scene.add(model);

        addModelToGui(model);
    });

    // Setup camera and renderer
    setupCamera(camera, [-25, 10, 50], [0, 0, 0]);


    setupRenderer(renderer, windowWidth, windowHeight, pixelRatio);
    document.querySelector('.js-three-wrapper').appendChild(renderer.domElement);

    // Setup post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Resize handler
    window.addEventListener('resize', () => {
        ({ width: windowWidth, height: windowHeight } = getWindowDimensions());
        renderer.setSize(windowWidth, windowHeight);
        camera.aspect = windowWidth / windowHeight;
        camera.updateProjectionMatrix();
        composer.setSize(windowWidth, windowHeight);
    });

    let keyframe = 0;

    // Render loop
    const render = () => {
        requestAnimationFrame(render);
        if (model) {
            // model.rotation.y += 0.002;
            // model.rotation.z += Math.cos(model.rotation.y) * 0.001;
            // model.rotation.x += Math.sin(model.rotation.y) * 0.001;
        }


        composer.render();
    };

    render();

}

export { threeModule };