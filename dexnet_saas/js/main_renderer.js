
if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
}

var container;

var camera, controls, scene, renderer;
var wireframe, ambient, keyLight, fillLight;
var material_main, mesh_main=null, mesh_main_file;
var grasp_axes_json, grasp_axes=null, num_grasps_rendered;
var model_id;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    /* Camera */
    camera = new THREE.PerspectiveCamera(5, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 1;
	camera.position.y = 1;

    /* Scene */
    scene = new THREE.Scene();
    wireframe = false;

    ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(-100, 0, 100);

    fillLight = new THREE.DirectionalLight(0xffffff, 0.75);
    fillLight.position.set(100, 0, 100);

    camera.add(keyLight);
    camera.add(fillLight);

    scene.add(camera);

    /* Renderer */
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0xffffff));

    container.appendChild(renderer.domElement);

    /* Controls */
    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.staticMoving = false;
    controls.rotateSpeed = 3.0;
	controls.dynamicDampingFactor = 0.2;
    controls.enableZoom = true;
	controls.minDistance = 1;
	controls.maxDistance = 10;
	controls.noPan = true;

    /* Events */
    window.addEventListener('resize', onWindowResize, false);
    
    /* Initialize default mesh, grasps */
    addModelUrl('assets/bar_clamp.obj');
    loadGraspAxes('assets/bar_clamp_grasps.json');
    enter_upload_mode();
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() {
    renderer.render(scene, camera);
}

/* Handling grasp axes */
function loadGraspAxes(url){
    $.getJSON(url, function(data) {
        grasp_axes_json = data
        grasp_axes_json.sort(function(a, b) {
            return a['metric_score'] - b['metric_score']
        });
        addGraspAxes(grasp_axes_json, 0, Infinity);
        min = grasp_axes_json[0]['metric_score'];
        max = grasp_axes_json[grasp_axes_json.length - 1]['metric_score'];
        $( "#slider-range" ).slider({
            range: true,
            min: min,
            max: max,
            step: (max - min) / 200,
        });
    });
}
function addGraspAxes(data, min_metric, max_metric){
    if (grasp_axes !== null) {
        for (var i = 0; i < grasp_axes.length; i++) {
            scene.remove(grasp_axes[i])
        }
    }
    grasp_axes = []
    var lower_idx = 0;
    var upper_idx = grasp_axes_json.length - 1;
    for (; grasp_axes_json[lower_idx]['metric_score'] < min_metric && lower_idx < grasp_axes_json.length; lower_idx++){}
    for (; grasp_axes_json[upper_idx]['metric_score'] > max_metric && upper_idx >= 0; upper_idx--){}
    var getHexColor = function(score){
        if (grasp_axes_json[lower_idx]['metric_score'] === grasp_axes_json[upper_idx]['metric_score']){
            return new THREE.Color(0, 1, 0)
        }
        score = (score - grasp_axes_json[lower_idx]['metric_score']) / (grasp_axes_json[upper_idx]['metric_score'] - grasp_axes_json[lower_idx]['metric_score'])
        return new THREE.Color(Math.min(Math.sqrt(Math.max(1 - 2 * score, 0)), 1), Math.min(Math.sqrt(2 * score), 1), 0)
    }
    for (var i = lower_idx; i <= upper_idx; i++){
        axis = getGraspAxis(data[i]['center'], data[i]['axis'], data[i]['open_width'], getHexColor(data[i]['metric_score']));
        scene.add(axis);
        grasp_axes.push(axis);
    }
    num_grasps_rendered = upper_idx - lower_idx + 1
    $( "#rendered-count" ).val( "(" + num_grasps_rendered + " grasps rendered)" );
}

/* Add model from url (or blob) */
function addModelUrl(url, rescale=true) {
    if (mesh_main !== null) {
        scene.remove(mesh_main)
    }
    var objLoader = new THREE.OBJLoader();
    material_main = new THREE.MeshLambertMaterial({color : 0xa0a0a0})
    material_main.side = THREE.DoubleSide
    objLoader.load(url, function (object) {
        object.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material = material_main;
            }
        });
        if (rescale){
            var bBox = new THREE.Box3().setFromObject(object)
            var bBoxSize = bBox.getSize();
            var bBoxCenter = bBox.getCenter();
            scale = 0.040 / Math.min(bBoxSize.y, bBoxSize.x, bBoxSize.z);
            console.log(scale)
            console.log(bBox.getCenter())
            object.scale.set(scale, scale, scale)
            object.position.x -= bBoxCenter.x;
            object.position.y -= bBoxCenter.y;
            object.position.z -= bBoxCenter.z;
        }
        scene.add(object);
        mesh_main = object
    });
}

/* Upload current model to server */
function uploadMesh() {
    var reader = new FileReader();
    var xhr = new XMLHttpRequest();
    this.xhr = xhr;
    var self = this;
    this.xhr.upload.addEventListener("progress", function(e) {
        if (e.lengthComputable) {
            var percentage = Math.round((e.loaded * 100) / e.total);
            console.log(percentage)
        }
    }, false);
    xhr.upload.addEventListener("load", function(e){
        console.log("100%")
    }, false);
    xhr.onload = function() {
        console.log(xhr.responseText)
        console.log(JSON.parse(xhr.responseText))
    }
      
    var formData = new FormData();
    formData.append("file", mesh_main_file);
    xhr.open("POST", "http://127.0.0.1:5000/upload-mesh");
    xhr.send(formData);
}



/* Jquery hooks */
$( "#mesh-file-field:hidden" ).change(function() {
    if (grasp_axes !== null) {
        for (var i = 0; i < grasp_axes.length; i++) {
            scene.remove(grasp_axes[i])
        }
    }
    var reader = new FileReader();
    reader.onload = function(event){
        addModelUrl(event.target.result, rescale=true)
    }
    reader.readAsDataURL(this.files[0])
    mesh_main_file = this.files[0]
    camera.position.z = 1;
    camera.position.y = 1;
    controls.forceIdle();
    enter_upload_mode();
});
$( "#slider-range" ).slider({
    range: true,
    min: 0,
    max: 100,
    values: [ 0, 100 ],
    step: 0.5,
    slide: function( event, ui ) {
        $( "#metric-limits" ).val( ui.values[ 0 ].toExponential(3) + " – " + ui.values[ 1 ].toExponential(3) );
    },
    stop: function( event, ui ) {
        addGraspAxes(grasp_axes_json, $( "#slider-range" ).slider( "values", 0 ), $( "#slider-range" ).slider( "values", 1 ));
    }
});
$( "#metric-limits" ).val( $( "#slider-range" ).slider( "values", 0 ).toExponential(3) + " – " + $( "#slider-range" ).slider( "values", 1 ).toExponential(3) );
$( "#rendered-count" ).val( "(" + num_grasps_rendered + " grasps rendered)");

$( "#wireframe-enable" ).change(function() {
    if(event.target.checked){
        material_main.wireframe = true;
    } else {
        material_main.wireframe = false;
    }
});
