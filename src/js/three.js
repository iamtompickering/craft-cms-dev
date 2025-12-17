import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PMREMGenerator } from 'three';

const threeModule = () => {
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let pixelRatio = window.devicePixelRatio;

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(10, windowWidth / windowHeight, 1, 2000);
    let renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    let pointLight, ambientLight;

    const settings = {
        metalness: 1.0,
        roughness: 0.015,
        ambientIntensity: 0.3,
        aoMapIntensity: 1.0,
        envMapIntensity: 2.5,
        displacementScale: 2.436143,
        normalScale: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0
    };

    const pmremGenerator = new PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envScene = new THREE.Scene();

    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x65e2ca,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -400;
    envScene.add(ground);

    const boxes = [
        { color: 0x65e2ca, position: [100, 50, 100], size: 100 },
        { color: 0x7388fe, position: [-100, 50, -100], size: 100 },
        { color: 0x65e2ca, position: [-100, 50, 100], size: 100 }
    ];

    boxes.forEach(({ color, position, size }) => {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshStandardMaterial({ color })
        );
        box.position.set(...position);
        envScene.add(box);
    });

    const envLights = [
        { type: 'AmbientLight', color: 0xffffff, intensity: 1.2 },
    ];

    envLights.forEach(({ type, color, intensity, position }) => {
        let light;
        if (type === 'AmbientLight') {
            light = new THREE.AmbientLight(color, intensity);
        } else if (type === 'PointLight') {
            light = new THREE.PointLight(color, intensity);
            if (position) {
                light.position.set(...position);
            }
        }
        envScene.add(light);
    });

    const envMap = pmremGenerator.fromScene(envScene).texture;
    pmremGenerator.dispose();

    const lights = [
        { type: 'AmbientLight', color: 0xffffff, intensity: settings.ambientIntensity, assignTo: 'ambientLight' },
        { type: 'PointLight', color: 0x65e2ca, intensity: 4.0, distance: 0, decay: 2, position: [0, 100, 250], assignTo: 'pointLight' },
        { type: 'PointLight', color: 0xff86db, intensity: 5.0, distance: 0, decay: 2, parent: 'camera' },
        { type: 'PointLight', color: 0x7388fe, intensity: 4.0, distance: 0, decay: 2, position: [-100, -100, 100] },
        { type: 'DirectionalLight', color: 0xffffff, intensity: 2.0, position: [200, 200, 200] }
    ];

    lights.forEach(({ type, color, intensity, distance, decay, position, parent, assignTo }) => {
        let light;
        if (type === 'AmbientLight') {
            light = new THREE.AmbientLight(color, intensity);
        } else if (type === 'PointLight') {
            light = new THREE.PointLight(color, intensity, distance, decay);
            if (position) {
                light.position.set(...position);
            }
        } else if (type === 'DirectionalLight') {
            light = new THREE.DirectionalLight(color, intensity);
            if (position) {
                light.position.set(...position);
            }
        }

        if (assignTo) {
            if (assignTo === 'ambientLight') {
                ambientLight = light;
            } else if (assignTo === 'pointLight') {
                pointLight = light;
            }
        }

        const target = parent === 'camera' ? camera : scene;
        target.add(light);
    });

    const controls = new OrbitControls(camera, renderer.domElement);

    const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: settings.roughness,
        metalness: settings.metalness,
        envMap: envMap,
        envMapIntensity: settings.envMapIntensity,
        clearcoat: settings.clearcoat,
        clearcoatRoughness: settings.clearcoatRoughness,
        transmission: 0.1,
        thickness: 1,
        side: THREE.DoubleSide
    });

    const loader = new GLTFLoader();
    let model = null;

    loader.load('/dist/tss.gltf', (gltf) => {
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });

        model = gltf.scene;
        scene.add(model);
    });

    camera.position.set(0, 10, 80);
    camera.lookAt(0, 0, -5);

    renderer.setClearColor('#000000');
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(windowWidth, windowHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    document.querySelector('.js-three-wrapper').appendChild(renderer.domElement);

    window.addEventListener('resize', () => {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        renderer.setSize(windowWidth, windowHeight);
        camera.aspect = windowWidth / windowHeight;
        camera.updateProjectionMatrix();
    });

    const render = () => {
        requestAnimationFrame(render);

        if (model) {
            model.rotation.y += 0.002;
            model.rotation.z += 0.001;
        }

        renderer.render(scene, camera);
    };

    render();

}

export { threeModule };