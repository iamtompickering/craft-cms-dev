import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const threeModule = () => {

    let
        windowWidth = window.innerWidth,
        windowHeight = window.innerHeight,
        pixelRatio = window.devicePixelRatio;

    let
        scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(20, windowWidth / windowHeight, 1, 2000),
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

    const controls = new OrbitControls(camera, renderer.domElement);

    const loader = new GLTFLoader();

    loader.load(
        '/dist/tss.gltf',
        function(gltf) {
            scene.add(gltf.scene);
        }
    );

    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 50;

    renderer.setClearColor('#f2f2f2');
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(windowWidth, windowHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    document.querySelector('.js-three-wrapper').appendChild(renderer.domElement);

    window.addEventListener(
        'resize',
        function() {

            windowWidth = window.innerWidth,
            windowHeight = window.innerHeight;

            renderer.setSize(windowWidth, windowHeight);

            camera.aspect = windowWidth / windowHeight;
            camera.updateProjectionMatrix();


        }
    );

    const render = () => {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    render();

}

export { threeModule };