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