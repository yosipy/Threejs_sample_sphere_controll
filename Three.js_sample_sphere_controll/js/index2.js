function return_ancestor_name_without_skeleton_name_list(selected_bone, skeleton_list){
    let bone;
    if(!skeleton_list[selected_bone.name]){
        bone = return_ancestor_name_without_skeleton_name_list(selected_bone.parent, skeleton_list);
    }else{
        bone = selected_bone;
    }

    return bone;
}



function make_sphere_and_plane(sphere_name, plane_name){
    const scene_for_controller = new THREE.Scene(); 

    // sphere
    const geometry = new THREE.SphereGeometry(1, 30, 30);
    const texture_loader = new THREE.TextureLoader();
    //const texture = texture_loader.load('expressions.png');
    const texture = texture_loader.load('test.png');
    const material = new THREE.MeshBasicMaterial({
        //color: new THREE.Color( 0, 1, 0 )
        map: texture
        //,lightMapIntensity: 0
    });
    //material.lights = false;
    material.transparent = true;
    material.opacity = 0.7;
    material.depthTest=false;
    // メッシュを作成
    const controller_mesh = new THREE.Mesh(geometry, material);
    controller_mesh.name = sphere_name;
    controller_mesh.scale.set(100, 100, 100);

    scene_for_controller.add(controller_mesh);


    // plane
    const geometry_plane = new THREE.PlaneBufferGeometry( 1, 1 );
    const material_plane = new THREE.MeshBasicMaterial();
    material_plane.depthTest=false;
    material_plane.transparent = true;
    material_plane.opacity = 0.0;
    const plane = new THREE.Mesh( geometry_plane, material_plane );
    plane.name = plane_name;
    scene_for_controller.add( plane );
    //plane.lookAt(main.camera_for_controller.position);
    //plane.scale.y = 300;
    //plane.scale.x = 200;

    return scene_for_controller;
}






function load_gltf_model(name, url, scene){
    // Load GLTF or GLB
    const loader = new THREE.GLTFLoader();
    loader.load(
        url,
        // onLoader
        function ( gltf ){
            const model = gltf.scene;
            model.name = name;

            function children_frustum_culled_to_false(model){
                for(let i = 0; i < model.children.length; ++i){
                    let child = model.children[i];
                    if(child.type === 'Object3D' || child.type === 'SkinnedMesh'){
                        child.frustumCulled = false;
                    }
                    children_frustum_culled_to_false(child);
                }
            }
            children_frustum_culled_to_false(model);

            create_skeleton_helper(model);


            model.children[0].children[0].scale.set(400.0, 400.0, 400.0);
            model.children[0].children[0].position.set(100,0,0);
            scene.add(model);

            console.log('model', model);
        },
        // onProgress
        function( xhr ) {
            if ( xhr.lengthComputable ) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
            }
        },
        // onError
        function ( error ) {
            console.log( 'An error happened' );
            console.log( error );
        }
    );
}


function make_renderer(canvas_id_name, allow_alpha, width, height){
    // レンダラーを作成
    const renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#'+canvas_id_name),
        alpha: allow_alpha,
        antialias: true
    });
    if(allow_alpha){
        renderer.setClearAlpha(0);
    }
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    renderer.setPixelRatio(1);
    renderer.setSize(width, height);

    return renderer;
}

class RendererContext{
    constructor(div_id_name, canvas_id_name, canvas_id_name_for_controller, scene, scene_for_controller, selected_bone){
        this.div_id_name = div_id_name;
        this.canvas_id_name = canvas_id_name;
        this.canvas_id_name_for_controller = canvas_id_name_for_controller;
        this.scene = scene;

        this.width = document.getElementById(div_id_name).clientWidth;
        this.height = document.getElementById(div_id_name).clientHeight;

        this.renderer_for_controller = make_renderer(canvas_id_name_for_controller, true, this.width, this.height);
        this.camera_for_controller = new THREE.OrthographicCamera( this.width / - 2, this.width / 2, this.height / 2, this.height / - 2, 1, 10000 );

        this.renderer = make_renderer(canvas_id_name, false, this.width, this.height);
        this.camera = new THREE.PerspectiveCamera(90, this.width / this.height, 1, 10000);
        this.camera.position.set(0, 400, -900);

        this.controls = new THREE.OrbitControls( this.camera, this.renderer_for_controller.domElement );
        this.controls.enableKeys = false;
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.RIGHT,
            RIGHT: THREE.MOUSE.MIDDLE
        }
        this.controls.target = new THREE.Vector3( 0, 400, 0 );
        this.controls.minDistance = 100;
        this.controls.maxDistance = 3000;

        this.camera_for_controller.position.subVectors(this.camera.position, this.controls.target);
        this.camera_for_controller.lookAt( 0, 0, 0 );

        // sphere and plane
        this.scene_for_controller = scene_for_controller;

        this.sphere_controller = new SphereController(this, scene, selected_bone);
    }
    resize(){
        this.width = document.getElementById(this.div_id_name).clientWidth;
        this.height = document.getElementById(this.div_id_name).clientHeight;

        // レンダラーのサイズを調整する
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);

        this.renderer_for_controller.setPixelRatio(window.devicePixelRatio/2);
        this.renderer_for_controller.setSize(this.width, this.height);

        // カメラのアスペクト比を正す
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.camera_for_controller.left = this.width / - 2;
        this.camera_for_controller.right = this.width / 2;
        this.camera_for_controller.top = this.height / 2;
        this.camera_for_controller.bottom = this.height / -2;
        this.camera_for_controller.updateProjectionMatrix();

        let plane = this.scene_for_controller.getObjectByName('Plane');
        plane.scale.x = this.width*2;
        plane.scale.y = this.height*2;
        console.log(plane);
    }
    render(){
        this.sphere_controller.update_sphere();

        // per frame
        this.controls.update();


        this.camera_for_controller.position.subVectors(this.camera.position, this.controls.target);
        this.camera_for_controller.position.normalize().multiplyScalar( 7000 );
        this.camera_for_controller.lookAt( 0, 0, 0 );
        
        let plane = this.scene_for_controller.getObjectByName('Plane');
        plane.lookAt(this.camera_for_controller.position);

        
        this.renderer.render(this.scene, this.camera);
        this.renderer_for_controller.render(this.scene_for_controller, this.camera_for_controller);
    }
}



class SelectedBone{
    constructor (){
        this.intersect = null;
    }
    select_bone(intersect){
        // deselect prev selected bone
        if(this.intersect !== null){
            this.intersect.object.material.color.setRGB(0, 1, 0);
        }
        // select clicked bone
        this.intersect = intersect;
        this.intersect.object.material.color.setRGB(1, 0, 0);
        console.log(this.intersect);
    }
    deselect_bone(){
        // deselect prev selected bone
        if(this.intersect !== null){
            this.intersect.object.material.color.setRGB(0, 1, 0);
        }
        this.intersect = null;
    }
    get_selected_bone(){
        if(this.intersect === null){
            return null;
        }
        return this.intersect.object.parent;
    }
}



class SphereController{
    constructor(renderer_context, scene, selected_bone){
        this.div_id = document.getElementById(renderer_context.div_id_name);
        this.renderer_context = renderer_context;
        this.scene_for_controller = renderer_context.scene_for_controller;
        this.scene = scene;
        this.sphere = this.scene_for_controller.getObjectByName('Sphere');
        this.plane = this.scene_for_controller.getObjectByName('Plane');

        this.selected_bone = selected_bone;

        this.screen_mouse = new THREE.Vector2(null,null);
        console.log(this.screen_mouse);

        this.mouse_on_this_div = false;

        this.now_position_on_sphere = null;
        this.previous_position_on_sphere = null;

        let _this = this;
        

        this.div_id.addEventListener( 'mouseup', onDocumentMouseUp, false );
        function onDocumentMouseUp( event ) {
            event.preventDefault();
            console.log('mouse up');

            _this.previous_position_on_sphere = null;
            _this.now_position_on_sphere = null;
        }
        this.div_id.addEventListener( 'mouseover', onDocumentMouseOver, false );
        function onDocumentMouseOver( event ) {
            event.preventDefault();
            console.log('mouse over');
            _this.mouse_on_this_div = true;
        }
        this.div_id.addEventListener( 'mouseout', onDocumentMouseOut, false );
        function onDocumentMouseOut( event ) {
            event.preventDefault();
            console.log('mouse out');
            _this.mouse_on_this_div = false;

            _this.previous_position_on_sphere = null;
            _this.now_position_on_sphere = null;
        }

        this.div_id.addEventListener( 'mousedown', onDocumentMouseDown, false );
        function onDocumentMouseDown( event ) {
            event.preventDefault();
            console.log('mouse down');
            _this.mouse_on_this_div = true;

            // left click
            if(event.button === 0){
                _this.screen_mouse.x = (event.clientX/_this.renderer_context.width)*2-1;
                _this.screen_mouse.y = -(event.clientY/_this.renderer_context.height)*2+1;
                if (_this.bone_selected_and_mouse_on_sphere()){
                    // on sphere
                    _this.set_now_position_on_sphere();

                }else{
                    // not on sphere
                    let raycaster = new THREE.Raycaster();
                    raycaster.setFromCamera( _this.screen_mouse, _this.renderer_context.camera );
                    let intersects = raycaster.intersectObjects( _this.scene.children ,true);
                    // select bone on mouse click
                    if(intersects.length === 0){
                        // ray don't hit bone
                        _this.deselect_bone();
                    }
                    for(let i = 0; i < intersects.length; ++i){
                        if(intersects[i].object.name === 'Skeleton_Helper'){
                            // ray hit bone
                            _this.select_bone(intersects[i]);
                            break;
                        }
                        if(i === intersects.length-1){
                            // ray don't hit bone
                            _this.deselect_bone();
                        }
                    }
                }
            }
        }
        this.div_id.addEventListener( 'mousemove', onDocumentMouseMove, false );
        function onDocumentMouseMove(event ){
            event.preventDefault();
            //console.log('mouse move');
            _this.screen_mouse.x = (event.clientX/_this.renderer_context.width)*2-1;
            _this.screen_mouse.y = -(event.clientY/_this.renderer_context.height)*2+1;

            _this.update_prevent_and_now_position_on_sphere();
            _this.apply_quaternion_from_two_vec();
        }
    }
    select_bone(intersect){
        // deselect prev selected bone
        this.selected_bone.select_bone(intersect);

        this.set_sphere_position_on_bone();
    }
    set_sphere_position_on_bone(){
        if(this.selected_bone.intersect === null){
            this.sphere.visible = false;
            return;
        }
        if(this.mouse_on_this_div === false){
            this.sphere.visible = false;
            return;
        }
        let selected_bone_position = this.get_selected_bone_position();
        let screen_position = this.get_screen_position(selected_bone_position);


        //console.log('screen_position: ', screen_position);

        if( this.is_sphere_frameout(selected_bone_position) ){
            this.sphere.visible = false;
            return;
        }

        this.sphere.visible = true;
        this.plane.lookAt(this.renderer_context.camera_for_controller.position);

        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera( screen_position, this.renderer_context.camera_for_controller );
        let intersects = raycaster.intersectObject( this.plane ,true);

        if(intersects.length > 0){
            //console.log(intersects);
            this.sphere.position.set(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z);
        }
    }
    bone_selected_and_mouse_on_sphere(){
        if (this.selected_bone.intersect !== null){
            let screen_mouse_pixel_scale = new THREE.Vector2();
            screen_mouse_pixel_scale.x = this.screen_mouse.x * this.renderer_context.width / 2;
            screen_mouse_pixel_scale.y = this.screen_mouse.y * this.renderer_context.height / 2;
            //console.log('screen_mouse_pixel_scale: ', screen_mouse_pixel_scale);

            let selected_bone_position = this.get_selected_bone_position();
            let screen_position = this.get_screen_position(selected_bone_position);
            let screen_position_pixel_scale = new THREE.Vector2();
            screen_position_pixel_scale.x = screen_position.x * this.renderer_context.width / 2;
            screen_position_pixel_scale.y = screen_position.y * this.renderer_context.height / 2;
            //console.log('screen_position_pixel_scale: ', screen_position_pixel_scale);

            let center_mouse_distance_squared = screen_position_pixel_scale.distanceToSquared(screen_mouse_pixel_scale);
            let sphere_radius = this.sphere.scale.x;
            if(center_mouse_distance_squared <= sphere_radius ** 2){
                return true;
            }
        }
        return false;
    }
    deselect_bone(){
        this.selected_bone.deselect_bone();
    }
    get_selected_bone_position(){
        if(this.selected_bone.intersect !== null){
            let bone_mesh = this.selected_bone.intersect.object;
            
            let vector = new THREE.Vector3();
            bone_mesh.getWorldPosition(vector);
            
            return vector;
        }
        return null;
    }
    get_screen_position(position){
        let pos = position.clone();
        pos.project(this.renderer_context.camera);

        let vector =new THREE.Vector2();
        vector.x = pos.x;
        vector.y = pos.y;
        return vector;
    }
    is_sphere_frameout(selected_bone_position){
        let V = this.renderer_context.camera.matrixWorldInverse;
        let P = this.renderer_context.camera.projectionMatrix;
        let VP = new THREE.Matrix4();
        VP.multiplyMatrices(P, V);

        let v = selected_bone_position.clone();
        v.applyMatrix4(VP);

        if( v.x < -1.5 || v.x > 1.5 || v.y < -1.5 || v.y > 1.5 ||v.z < -1.0 || v.z > 1.0 ){
            return true
        }

        return false;
    }

    get_radian_between(vec1, vec2){
        let vec = new THREE.Vector3();
        vec = vec1.dot(vec2);

        return Math.acos(vec / (vec1.length() * vec2.length()));
    }
    update_sphere(){
        this.set_sphere_position_on_bone();
        this.synchronize_quaternion_of_sphere_with_selected_bone();
    }
    set_now_position_on_sphere(){
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera( this.screen_mouse, this.renderer_context.camera_for_controller );
        let intersects = raycaster.intersectObjects( [this.sphere, this.plane], true);

        // when mouse click on sphere
        if(intersects.length > 0){
            this.now_position_on_sphere = intersects[0].point.clone();
            //console.log(intersects[0]);
        }else{
            // 念のために失敗時は初期化
            this.now_position_on_sphere = null;
        }
    }
    synchronize_quaternion_of_sphere_with_selected_bone(){
        if(this.selected_bone.intersect === null){
            return;
        }
        let bone = this.selected_bone.get_selected_bone();
        //console.log(bone.getWorldQuaternion());
        bone.getWorldQuaternion(this.sphere.quaternion);
        this.sphere.updateMatrixWorld(false);
        this.sphere.updateMatrix();
    }
    update_prevent_and_now_position_on_sphere(){
        if(this.now_position_on_sphere === null){
            return;
        }
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera( this.screen_mouse, this.renderer_context.camera_for_controller );
        let intersects = raycaster.intersectObjects( [this.sphere, this.plane], true);

        // when mouse click on sphere
        if(intersects.length > 0){
            this.previous_position_on_sphere = this.now_position_on_sphere.clone(); //多分CLONEいらない？
            this.now_position_on_sphere = intersects[0].point.clone();
            //console.log(intersects[0]);
        }else{
            // 念のために失敗時は初期化
            this.previous_position_on_sphere = null;
            this.now_position_on_sphere = null;
        }
    }
    apply_quaternion_from_two_vec(){
        if(this.previous_position_on_sphere === null || this.now_position_on_sphere === null){
            return;
        }
        let previous_position_on_sphere = this.previous_position_on_sphere;
        let now_position_on_sphere = this.now_position_on_sphere;

        let bone = this.selected_bone.get_selected_bone();

        let previous_vector_center_to_surface = new THREE.Vector3();
        previous_vector_center_to_surface.subVectors(previous_position_on_sphere, this.sphere.position);
        previous_vector_center_to_surface.normalize();
        let now_vector_center_to_surface = new THREE.Vector3();
        now_vector_center_to_surface.subVectors(now_position_on_sphere, this.sphere.position);
        now_vector_center_to_surface.normalize();

        let axis = new THREE.Vector3();
        axis = axis.crossVectors(previous_vector_center_to_surface, now_vector_center_to_surface);
        axis = axis.normalize().normalize();

        // start
        // 回転軸を決める際、親BONEの回転を反映できなかった
        // Sphere表面上の座標を直接回転させることができなかったので
        // 回転軸を回転させて対処している
        // ここの処理がないと子BONEの回転がずれる
        let parent_world_quaternion = new THREE.Quaternion();
        bone.parent.getWorldQuaternion(parent_world_quaternion);
        parent_world_quaternion.w = -parent_world_quaternion.w;
        axis.applyQuaternion(parent_world_quaternion);
        // end

        let angle = Math.acos( 
            (previous_vector_center_to_surface.dot(now_vector_center_to_surface)) 
            / (previous_vector_center_to_surface.length()*now_vector_center_to_surface.length()) );
        
        // 動きがなかった時の処理 angle = 0 or Nan. perhaps very small num ?
        if(axis.equals(new THREE.Vector3(0, 0, 0))){
            console.log(axis);
            console.log(angle);
            return;
        }
        
        let quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle( axis, angle );
        bone.applyQuaternion(quaternion);
    }



}

