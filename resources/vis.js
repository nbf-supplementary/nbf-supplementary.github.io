import * as THREE from "three";
import { OrbitControls } from "./OrbitControls.js";
import { OBJLoader } from "./OBJLoader.js";
import { PLYLoader } from "./ply.js";
import GUI from "./lilgui.js";


const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const width = window.innerWidth;
const height = window.innerHeight - 200;
const ratio = width / height;
const camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000);
camera.up = new THREE.Vector3(0, 0, 1);
camera.position.y = -5;

const renderer = new THREE.WebGLRenderer();
// renderer.setSize(960, 640);
renderer.setSize(width, height);
// document.body.appendChild(renderer.domElement);
document.getElementById("canvas").appendChild(renderer.domElement);


// Set up Controls
const controls = new OrbitControls(camera, renderer.domElement, scene);
// controls.setGizmosVisible(false);


// Set up Lights
const light = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(light);
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);


// Load Convexes
const cvxGroup = new THREE.Group();
scene.add(cvxGroup);

const cvxs = [];
const cvxLoader = new OBJLoader();
function onLoadConvex(obj, i) {
    const subgroup = new THREE.Group();
    const geometry = obj.children[0].geometry;
    const material = new THREE.MeshBasicMaterial({ color: 0x404040 });
    material.transparent = true;
    material.opacity = 0.2;
    const cvx = new THREE.Mesh(geometry, material);
    subgroup.add(cvx);

    const material2 = new THREE.MeshBasicMaterial({ color: 0x404040 });
    material2.wireframe = true;
    const cvx2 = new THREE.Mesh(geometry, material2);
    subgroup.add(cvx2);

    cvxGroup.add(subgroup);
    cvxs[i] = subgroup;
    if (i != 0) {
        subgroup.visible = false;
    } else {
        renderer.render(scene, camera);
    }
}
for (var i = 0; i < 14; i++) {
    cvxs.push(null);
    const id = i;
    cvxLoader.load("resources/scene/cvx_hulls/0_12_" + i + ".obj", function (o) {
        onLoadConvex(o, id);
    });
}


// Load points
const plyLoader = new PLYLoader();

const seedGroup = new THREE.Group();
scene.add(seedGroup);
plyLoader.load("resources/scene/scene0046_01.seeds.ply", function (geometry) {
    const material = new THREE.PointsMaterial({ color: 0xff0000 });
    material.size = 0.1;
    const points = new THREE.Points(geometry, material);
    seedGroup.add(points);
    renderer.render(scene, camera);
});

const instGroup = new THREE.Group();
scene.add(instGroup);
plyLoader.load("resources/scene/scene0046_01.pts.instance_pred.ply", function (geometry) {
    const material = new THREE.PointsMaterial({ vertexColors: true });
    material.size = 0.01;
    const points = new THREE.Points(geometry, material);
    instGroup.add(points);
    renderer.render(scene, camera);
});

const gtGroup = new THREE.Group();
gtGroup.visible = false;
scene.add(gtGroup);
plyLoader.load("resources/scene/scene0046_01.pts.instance_gt.ply", function (geometry) {
    const material = new THREE.PointsMaterial({ vertexColors: true });
    material.size = 0.01;
    const points = new THREE.Points(geometry, material);
    gtGroup.add(points);
});

const inpGroup = new THREE.Group();
inpGroup.visible = false;
scene.add(inpGroup);
plyLoader.load("resources/scene/scene0046_01.pts.input.ply", function (geometry) {
    const material = new THREE.PointsMaterial({ color: 0x303030 });
    material.size = 0.01;
    const points = new THREE.Points(geometry, material);
    inpGroup.add(points);
});


// Set up GUI
const gui = new GUI();
gui.onFinishChange(function () {
    if (guiState.showCvx) {
        cvxGroup.visible = true;
    } else {
        cvxGroup.visible = false;
    }
    if (guiState.showSeeds) {
        seedGroup.visible = true;
    } else {
        seedGroup.visible = false;
    }
    if (guiState.layer == "Instance Segmentation") {
        instGroup.visible = true;
        gtGroup.visible = false;
        inpGroup.visible = false;
    } else if (guiState.layer == "Instance Segmentation (Ground Truth)") {
        instGroup.visible = false;
        gtGroup.visible = true;
        inpGroup.visible = false;
    } else if (guiState.layer == "Input Points") {
        instGroup.visible = false;
        gtGroup.visible = false;
        inpGroup.visible = true;
    }
    for (var i = 0; i < cvxs.length; i++) {
        cvxs[i].visible = (i == guiState.currentInst);
    }

    renderer.render(scene, camera);
});

const guiState = {
    layer: "Instance Segmentation",
    showCvx: true,
    showSeeds: true,
    currentInst: 0,
};

gui.add(guiState, "showCvx");
gui.add(guiState, "showSeeds");
const instIDs = [];
for (var i = 0; i < cvxs.length; i++) instIDs.push(i);
gui.add(guiState, "currentInst", instIDs);
gui.add(guiState, 'layer', [
    "Input Points",
    "Instance Segmentation",
    // "Instance Segmentation (Ground Truth)",
    // "Convex Hulls"
]);

controls.addEventListener("change", function () {
    renderer.render(scene, camera);
});
controls.update();