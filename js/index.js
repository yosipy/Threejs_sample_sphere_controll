window.addEventListener('DOMContentLoaded', init);
function init() {
    // シーンを作成
    const scene = new THREE.Scene();

    // 平行光源
    const light = new THREE.DirectionalLight(0xFFFFFF);
    light.intensity = 2; // 光の強さを倍に
    light.position.set(1, 1, 1);
    scene.add(light);

    // cretate grid
    let size = 5000;
    let divisions = 10;
    const gridHelper = new THREE.GridHelper( size, divisions, new THREE.Color(0,0,1), new THREE.Color(1,1,1) );
    scene.add( gridHelper );


    // ウィンドウサイズ設定
    const scene_for_controller = make_sphere_and_plane('Sphere', 'Plane');
    const selected_bone = new SelectedBone();
    const main = new RendererContext('main', 'main_canvas_0', 'main_canvas_1', scene, scene_for_controller, selected_bone);


    // Load GLTF or GLB
    const url = 'http://localhost/Three.js_sample_sphere_controll/0001.glb';
    load_gltf_model('model_with_cloth', url, scene);

    // 初回実行
    tick();
    function tick() {

        main.render(scene);
        requestAnimationFrame(tick);
    }

    // 初期化のために実行
    onResize();

    // リサイズイベント発生時に実行
    window.addEventListener('resize', onResize);
    function onResize() {

        main.resize();

    }

}

