import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HDRLoader, RGBELoader } from 'three/examples/jsm/Addons.js';
import { mix, color, positionLocal } from 'three/tsl';

async function init() {
    const renderer = new THREE.WebGPURenderer({ antialias: true });
    await renderer.init();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    // scene.add(ambientLight);

    // const dirLight = new THREE.DirectionalLight(0xffffff, 0);
    // dirLight.position.set(5, 10, 5);
    // scene.add(dirLight);

    //環境
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(environment).texture;
    pmremGenerator.dispose();

    //hdr背景
    const hdrLoader = new HDRLoader();
    const hdrTexture = await hdrLoader.loadAsync('/public/grasslands_sunset_4k.hdr');
    // const hdrTexture = await hdrLoader.loadAsync('/public/qwantani_moonrise_puresky_4k.hdr');
    hdrTexture.mapping = THREE.EquirectangularRefractionMapping;
    scene.background = hdrTexture;
    scene.environment = hdrTexture;



    // const geometry = new THREE.BoxGeometry();
    // const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    // const cube = new THREE.Mesh(geometry, material);
    // cube.position.set(0, 1, 0);
    // scene.add(cube);
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('/public/models/クリスタル本体.glb');
    const gltf2 = await loader.loadAsync('/public/models/クリスタル本体.glb');
    const gltf3 = await loader.loadAsync('/public/models/クリスタル本体.glb');
    gltf2.scene.scale.set(0.4, 0.4, 0.4);
    gltf3.scene.scale.set(0.4, 0.4, 0.4);
    // console.log(gltf2.scene);
    gltf2.scene.position.set(1, -1, 0);
    gltf3.scene.position.set(-1, -1, 0);
    gltf2.scene.rotation.z = -40 * (Math.PI / 180);
    gltf3.scene.rotation.z = 40 * (Math.PI / 180);
    // gltf2.scene.rotation.z = -0.5;
    // gltf3.scene.rotation.z = 0.5;
    gltf.scene.position.set(0, -1, 0);

    //マテリアル
    //グラデーション
    const topColor = color(0x88ccff);
    const bottomColor = color(0xff88cc);

    const gradientColor = mix(bottomColor, topColor, positionLocal.y.add(2).div(2));
    const crystalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,    // 白（色をつけない）
    roughness: 0.0,     // ツルツル
    metalness: 0.0,
    transmission: 1.0,  // 完全透過
    thickness: 2.0,     // 素材の厚み
    ior: 1.3,           // ガラスの屈折率
    dispersion: 3.0,    // プリズム効果なし
    });
    // crystalMaterial.colorNode = gradientColor;


    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            child.material = crystalMaterial;
        }
    });
    scene.add(gltf.scene, gltf2.scene, gltf3.scene);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    renderer.setAnimationLoop(() => {
        // gltf.scene.rotation.y += 0.02;
        // gltf2.scene.rotation.y += 0.01;
        // gltf2.scene.rotation.z += 0.01;
        // gltf.rotation.y += 0.01;
        renderer.render(scene, camera);
    });
}
init()