# threejs-webgpu-model-study

Three.js WebGPU を使って、3Dモデルをきれいに表示するための学習リポジトリ。

## 目標

Blenderで作成した3Dモデルを WebGPU レンダラーでできる限りきれいに表示できるようになる。

## 学習トピック

### WebGPURenderer
- [x] WebGPURenderer の基本的な使い方
- [x] WebGLRenderer との違い

### GLTFLoader
- [ ] GLBファイルの読み込み
- [ ] シーンへの追加

### マテリアル
- [ ] MeshStandardMaterial
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



### マテリアル


### ライティング


### シャドウ


### OrbitControls