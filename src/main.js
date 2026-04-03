import * as THREE from 'three/webgpu'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { WaterMesh } from 'three/examples/jsm/objects/WaterMesh.js'
import { SkyMesh } from 'three/examples/jsm/objects/SkyMesh.js'

// シーン・カメラ・レンダラー
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
)
camera.position.set(0, 2., 5)

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.5
document.body.appendChild(renderer.domElement)

// コントロール
const controls = new OrbitControls(camera, renderer.domElement)
controls.maxPolarAngle = Math.PI * 0.9
controls.minDistance = 1
controls.maxDistance = 500
controls.update()

// 太陽の位置
const sun = new THREE.Vector3()

// 空
const sky = new SkyMesh()
sky.scale.setScalar(10000)
scene.add(sky)

sky.turbidity.value = 10
sky.rayleigh.value = 3
sky.mieCoefficient.value = 0.005
sky.mieDirectionalG.value = 0.7

// 海面
const waterGeometry = new THREE.PlaneGeometry(10000, 10000)
const waterNormals = new THREE.TextureLoader().load('/textures/waternormals.jpg')
waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping

const water = new WaterMesh(waterGeometry, {
    waterNormals: waterNormals,
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 100.2,
})
water.rotation.x = -Math.PI / 2
water.position.y = -0.2
scene.add(water)
console.log(water)
// DirectionalLight（太陽と同期）
const dirLight = new THREE.DirectionalLight(0xffffff, 2.0)
scene.add(dirLight)

// クリスタルマテリアル
const crystalMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    roughness: 0.0,
    metalness: 0.0,
    transmission: 1.0,
    thickness: 2.0,
    ior: 1.25,
    dispersion: 1.5,
})

// モデル読み込み
const loader = new GLTFLoader()
const loadModel = async () => {
    const gltf = await loader.loadAsync('/public/models/クリスタル本体.glb')
    const gltf2 = await loader.loadAsync('/public/models/クリスタル本体.glb')
    const gltf3 = await loader.loadAsync('/public/models/クリスタル本体.glb')

    gltf.scene.position.set(0, 0, 0)
    gltf2.scene.position.set(2, 0, 0)
    gltf3.scene.position.set(-2, 0, 0)
    gltf2.scene.scale.set(0.4, 0.4, 0.4)
    gltf3.scene.scale.set(0.4, 0.4, 0.4)
    gltf2.scene.rotation.z = -40 * (Math.PI / 180)
    gltf3.scene.rotation.z = 40 * (Math.PI / 180)

    gltf.scene.traverse((child) => {
        if (child.isMesh) child.material = crystalMaterial
    })

    scene.add(gltf.scene, gltf2.scene, gltf3.scene)
}

// 太陽の位置を更新する関数
const pmremGenerator = new THREE.PMREMGenerator(renderer)
const sceneEnv = new THREE.Scene()
let renderTarget

function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - 2.5)
    const theta = THREE.MathUtils.degToRad(180)

    sun.setFromSphericalCoords(1, phi, theta)

    sky.sunPosition.value.copy(sun)
    water.sunDirection.value.copy(sun).normalize()

    // DirectionalLight を太陽と同じ方向に設定
    dirLight.position.copy(sun).multiplyScalar(100)

    if (renderTarget !== undefined) renderTarget.dispose()

    sceneEnv.add(sky)
    renderTarget = pmremGenerator.fromScene(sceneEnv)
    scene.add(sky)

    scene.environment = renderTarget.texture
}

// WebGPU初期化後に実行
renderer.init().then(async () => {
    updateSun()
    await loadModel()
})

// アニメーションループ
renderer.setAnimationLoop(() => {
    water.time += 0
    controls.update()
    renderer.render(scene, camera)
})

// リサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})