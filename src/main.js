import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/Addons.js';
import { mix, color, positionLocal } from 'three/tsl';

async function init() {
    // レンダラー
    const renderer = new THREE.WebGPURenderer({ antialias: true });
    await renderer.init();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // シーン・カメラ
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // HDR背景・環境マップ
    const hdrLoader = new HDRLoader();
    const hdrTexture = await hdrLoader.loadAsync('/public/grasslands_sunset_4k.hdr');
    hdrTexture.mapping = THREE.EquirectangularRefractionMapping;
    scene.background = hdrTexture;
    scene.environment = hdrTexture;

    // 床
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.05,
        metalness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -90 * (Math.PI / 180);
    floor.position.y = -1;
    scene.add(floor);

    // マテリアル
    const crystalMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.0,
        metalness: 0.0,
        transmission: 1.0,
        thickness: 2.0,
        ior: 1.25,
        dispersion: 1.5,
    });

    // モデル読み込み
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('/public/models/クリスタル本体.glb');
    const gltf2 = await loader.loadAsync('/public/models/クリスタル本体.glb');
    const gltf3 = await loader.loadAsync('/public/models/クリスタル本体.glb');

    gltf.scene.position.set(0, -1, 0);
    gltf2.scene.position.set(1, -1, 0);
    gltf3.scene.position.set(-1, -1, 0);
    gltf2.scene.scale.set(0.4, 0.4, 0.4);
    gltf3.scene.scale.set(0.4, 0.4, 0.4);
    gltf2.scene.rotation.z = -40 * (Math.PI / 180);
    gltf3.scene.rotation.z = 40 * (Math.PI / 180);

    gltf.scene.traverse((child) => {
        if (child.isMesh) child.material = crystalMaterial;
    });

    scene.add(gltf.scene, gltf2.scene, gltf3.scene);

    // リサイズ対応
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // アニメーションループ
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
}
init();