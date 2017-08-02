
if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
}

var container;

var camera, controls, scene, renderer;
var wireframe, ambient, keyLight, fillLight;
var material_main, mesh_main=null;
var grasp_axes_json, grasp_axes=null, num_grasps_rendered;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    /* Camera */
    camera = new THREE.PerspectiveCamera(5, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 1.5;

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
    controls.staticMoving = true;
    controls.rotateSpeed = 6.0;
    controls.enableZoom = true;

    /* Events */
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', onKeyboardEvent, false);

    /* Initialize default mesh, grasps */
    addModelUrl('assets/bar_clamp.obj');
    addGraspAxesUrl('assets/bar_clamp_grasps.json');


    /* Jquery */
    $( "#mesh-file-field" ).change(function() {
        if (grasp_axes !== null) {
            for (var i = 0; i < grasp_axes.length; i++) {
                scene.remove(grasp_axes[i])
            }
        }
        addModelFile(this.files[0])
    });
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyboardEvent(e) {
    if (e.code === 'KeyM') {
        wireframe = !wireframe;
        if (wireframe) {
            material_main.wireframe = true;
        } else {
            material_main.wireframe = false;
        }
    }
    if (e.code === 'KeyW') {
        var colorHex = material_main.color.getHex()
        if (colorHex < 0xffffff) {
            material_main.color.setHex(colorHex + 0x010101)
        }
    }
    if (e.code ==='KeyS') {
        var colorHex = material_main.color.getHex()
        if (colorHex > 0x000000) {
            material_main.color.setHex(colorHex - 0x010101)
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() {
    renderer.render(scene, camera);
}

function addGraspAxesUrl(url){
    $.getJSON(url, function(data) {
        grasp_axes_json = data
        grasp_axes_json.sort(function(a, b) {
            return a['metric_score'] - b['metric_score']
        });
        addGraspAxes(data, 0, Infinity)
        $( function() {
            min = grasp_axes_json[0]['metric_score']
            max = grasp_axes_json[grasp_axes_json.length - 1]['metric_score']
            $( "#slider-range" ).slider({
                range: true,
                min: min,
                max: max,
                values: [ min, max ],
                step: (max - min) / 200,
                slide: function( event, ui ) {
                    $( "#metric-limits" ).val( ui.values[ 0 ].toExponential(3) + " – " + ui.values[ 1 ].toExponential(3) );
                },
                stop: function( event, ui ) {
                    addGraspAxes(data, $( "#slider-range" ).slider( "values", 0 ), $( "#slider-range" ).slider( "values", 1 ));
                }
            });
        $( "#metric-limits" ).val( $( "#slider-range" ).slider( "values", 0 ).toExponential(3) + " – " + $( "#slider-range" ).slider( "values", 1 ).toExponential(3) );
        $( "#rendered-count" ).val( "(" + num_grasps_rendered + " grasps rendered)");
        } );
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
        grasp_axes.push(addGraspAxisVectors(data[i]['center'], data[i]['axis'], data[i]['open_width'], getHexColor(data[i]['metric_score'])))
    }
    num_grasps_rendered = upper_idx - lower_idx + 1
    $( "#rendered-count" ).val( "(" + num_grasps_rendered + " grasps rendered)" );
}

function addGraspAxisVectors(center, axis, width, color) {
    center = new THREE.Vector3().fromArray(center)
    axis = new THREE.Vector3().fromArray(axis)
    var axis_scaled = axis.clone().multiplyScalar(width / 2.0)
    ep1 = center.clone().sub(axis_scaled)
    ep2 = center.clone().add(axis_scaled)
    
    material = new THREE.MeshLambertMaterial({color : color})
    material.side = THREE.DoubleSide


    var radiusSegments = 16
    var radius = 0.002
    var capsule = new THREE.Object3D();
    var cylinderGeom = new THREE.CylinderGeometry (radius, radius, width, radiusSegments, 1, true); // open-ended
    var cylinderMesh = new THREE.Mesh (cylinderGeom, material);

    // pass in the cylinder itself, its desired axis, and the place to move the center.
    makeLengthAngleAxisTransform (cylinderMesh, axis, center);
    capsule.add (cylinderMesh);

    // instance geometry
    var hemisphGeom = new THREE.SphereGeometry (radius, radiusSegments, radiusSegments/2, 0, 2*Math.PI, 0, Math.PI/2);

    // make a cap instance of hemisphGeom around 'center', looking into some 'direction'
    var makeHemiCapMesh = function (direction, center)
    {
        var cap = new THREE.Mesh (hemisphGeom, material);

        makeLengthAngleAxisTransform (cap, direction, center);

        return cap;
    };
    capsule.add (makeHemiCapMesh (axis, ep2));

    // reverse the axis so that the hemiCaps would look the other way
    axis.negate();

    capsule.add (makeHemiCapMesh (axis, ep1));

    scene.add( capsule );

    return capsule;
}

// Transform object to align with given axis and then move to center 
function makeLengthAngleAxisTransform (obj, align_axis, center)
{
    obj.matrixAutoUpdate = false;

    // From left to right using frames: translate, then rotate; TR.
    // So translate is first.
    obj.matrix.makeTranslation (center.x, center.y, center.z);

    // take cross product of axis and up vector to get axis of rotation
    var yAxis = new THREE.Vector3 (0, 1, 0);

    // Needed later for dot product, just do it now;
    var axis = new THREE.Vector3();
    axis.copy (align_axis);
    axis.normalize();

    var rotationAxis = new THREE.Vector3();
    rotationAxis.crossVectors (axis, yAxis);
    if  (rotationAxis.length() < 0.000001) {
        // Special case: if rotationAxis is just about zero, set to X axis,
        // so that the angle can be given as 0 or PI. This works ONLY
        // because we know one of the two axes is +Y.
        rotationAxis.set (1, 0, 0);
    }
    rotationAxis.normalize();

    // take dot product of axis and up vector to get cosine of angle of rotation
    var theta = -Math.acos (axis.dot (yAxis));
    var rotMatrix = new THREE.Matrix4();
    rotMatrix.makeRotationAxis (rotationAxis, theta);
    obj.matrix.multiply (rotMatrix);
}


function addModelUrl(url) {
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
        scene.add(object);
        mesh_main = object
    });
}

function addModelFile(file){
    var reader = new FileReader();
    reader.onload = function(event){
        url = event.target.result
        addModelUrl(url)
    }
    reader.readAsDataURL(file)
}

