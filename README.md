# threejs-webgpu-model-study

Three.js WebGPU を使って、3Dモデルをきれいに表示するための学習リポジトリ。

## 目標

Blenderで作成した3Dモデルを WebGPU レンダラーでできる限りきれいに表示できるようになる。

## 学習トピック

### WebGPURenderer
- [x] WebGPURenderer の基本的な使い方
- [x] WebGLRenderer との違い

### GLTFLoader
- [x] GLBファイルの読み込み
- [x] シーンへの追加

### マテリアル
- [x] MeshStandardMaterial
- [ ] MeshBasicMaterial
- [ ] ベイクしたテクスチャの表示

### ライティング
- [ ] AmbientLight
- [ ] DirectionalLight
- [ ] PointLight / SpotLight

### シャドウ
- [ ] シャドウの設定
- [ ] シャドウの種類と品質

### OrbitControls
- [ ] 基本的な操作
- [ ] damping の設定

## メモ

### WebGPURenderer

`three/webgpu` からインポートして使う。WebGLRenderer との最大の違いは **初期化が非同期である**こと。
`await renderer.init()` を呼ばないと、GPU の準備が整う前にレンダリングが始まってしまう。
そのため、セットアップ処理全体を `async function` で包む必要がある。
```js
async function init() {
  const renderer = new THREE.WebGPURenderer({ antialias: true });
  await renderer.init(); // GPU初期化を待つ
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement); // canvasをbodyに追加
}
init();
```

**`renderer.domElement` について**
Three.js のレンダラーは内部で `<canvas>` 要素を自動生成する。
`renderer.domElement` はその canvas への参照で、`appendChild` で HTML の body に追加することで画面に表示される。

**リサイズ対応について**
ウィンドウサイズが変わったとき、カメラと canvas の両方を更新する必要がある。
```js
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; // アスペクト比を更新
  camera.updateProjectionMatrix();                        // 内部計算を作り直す（必須）
  renderer.setSize(window.innerWidth, window.innerHeight); // canvasサイズを更新
});
```

`camera.aspect` を変えただけでは反映されない。必ず `updateProjectionMatrix()` とセットで呼ぶ。

### PerspectiveCamera
```js
new THREE.PerspectiveCamera(fov, aspect, near, far)
```

| 引数 | 意味 | 今回の値 |
|------|------|----------|
| fov | 縦方向の視野角（度） | `60` |
| aspect | アスペクト比（横÷縦） | `window.innerWidth / window.innerHeight` |
| near | これより近いものは描画しない | `0.1` |
| far | これより遠いものは描画しない | `100` |

near と far で描画範囲を絞ることで GPU の負荷を抑えられる。
広いシーン（湖など）では `far` の値を大きくする必要がある。

### GLTFLoader

`three/examples/jsm/loaders/GLTFLoader.js` からインポートして使う。
```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const gltf = await loader.loadAsync('/models/your-model.glb');
scene.add(gltf.scene);
```

**`loadAsync` が非同期な理由**
GLB ファイルはサイズが大きいため、読み込み完了を待たずに次の処理が走ると
モデルが存在しない状態でレンダリングが始まってしまう。
`await` で読み込み完了を待つことで確実にモデルが表示される。

**`gltf` と `gltf.scene` の違い**
`loadAsync()` が返す `gltf` はデータオブジェクトであり、3Dオブジェクトではない。
回転・移動などの操作や `scene.add()` には `gltf.scene` を使う。

| プロパティ | 内容 |
|---|---|
| `gltf.scene` | モデル全体のルートオブジェクト |
| `gltf.animations` | アニメーションデータ |
| `gltf.cameras` | カメラデータ |

**モデルの操作（position / scale / rotation）**
`gltf.scene` に対して position・scale・rotation を使って操作できる。
```js
// 位置
gltf.scene.position.set(0, -1, 0);

// 大きさ（set() で呼ぶ、= で代入しない）
gltf.scene.scale.set(0.2, 0.2, 0.2);

// 傾き（単位はラジアン）
gltf.scene.rotation.z = -0.5;

// 度数で指定したい場合
gltf.scene.rotation.z = -30 * (Math.PI / 180);
```

`scale` や `rotation` は Vector3 オブジェクトなので `= 0.2` のように直接代入できない。
必ず `scale.set()` か `scale.x = 0.2` のように使う。

![alt text](image.png)
### マテリアル

**MeshStandardMaterial の主要プロパティ**
物理ベースレンダリング（PBR）に基づいたマテリアル。ライトの影響を受けるリアルな表現ができる。

| プロパティ | 意味 | 値の範囲 |
|---|---|---|
| `color` | 基本の色 | 16進数カラー |
| `roughness` | 表面の粗さ | 0（ツルツル）〜 1（ザラザラ） |
| `metalness` | 金属っぽさ | 0（非金属）〜 1（金属） |
| `transparent` | 透明を有効にするフラグ | true / false |
| `opacity` | 透明度 | 0（透明）〜 1（不透明） |
| `emissive` | 自発光の色 | 16進数カラー |
| `emissiveIntensity` | 自発光の強さ | 0〜 |

`transparent: true` にしないと `opacity` が効かない。必ずセットで使う。

**traverse で全メッシュにマテリアルを適用**
`gltf.scene` の中に複数のメッシュがある場合、`traverse` で全部巡回して適用する。
```js
gltf.scene.traverse((child) => {
    if (child.isMesh) {
        child.material = crystalMaterial;
    }
});
```

**環境マップ（RoomEnvironment）の追加**
`MeshStandardMaterial` は周囲の環境を反射する。環境マップがないと反射する対象がなく安っぽく見える。
`RoomEnvironment` を使うと手軽に環境反射を追加できる。
```js
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// scene の定義より後に書く
const environment = new RoomEnvironment();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(environment).texture;
pmremGenerator.dispose();
```



### ライティング


### シャドウ


### OrbitControls