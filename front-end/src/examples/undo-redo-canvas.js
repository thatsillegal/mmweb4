/* eslint-disable no-unused-vars,no-case-declarations */

import * as THREE from "three";
import * as ARCH from "@/archiweb"
import * as UndoManager from "undo-manager";

let scene, renderer, camera;
const raycaster = new THREE.Raycaster();
const xoy = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
let gf, mt, gui;

const undoManager = new UndoManager();

const undoList = [];
const redoList = [];

function createCircle(pt) {
  let color = new THREE.Color().setHSL(Math.random(), 0.2, 0.6).getHex();
  console.log(color.toString(16))
  undoList.push(gf.Cylinder([pt.x, pt.y, pt.z], [Math.random() * 100 + 50, Math.random() * 5 + 1], mt.Flat(color), true));
  
  undoManager.add({
    undo: function () {
      const item = undoList.pop();
      scene.remove(item);
      redoList.push(item);
    },
    redo: function () {
      const item = redoList.pop();
      scene.add(item);
      undoList.push(item);
    }
  })
}

function initGUI() {
  const control = {
    undo: function () {
      undoManager.undo();
    },
    redo: function () {
      undoManager.redo();
    }
  }
  gui.add(control, 'undo');
  gui.add(control, 'redo');
}

/* ---------- create your scene object ---------- */
function initScene() {
  scene.background = new THREE.Color('0xffffff');
  
  gf = new ARCH.GeometryFactory(scene);
  mt = new ARCH.MaterialFactory();
  
  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(0, 0, 1000);
  scene.add(light);
  // refresh global objects
  // ARCH.refreshSelection();
}

function onClick(event) {
  console.log(event.clientX, event.clientY);
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  )
  raycaster.setFromCamera(mouse, camera);
  let pt = raycaster.ray.intersectPlane(xoy, new THREE.Vector3());
  console.log(pt)
  createCircle(pt);
}


/* ---------- main entry ---------- */
function main() {
  const viewport = new ARCH.Viewport();
  renderer = viewport.renderer;
  scene = viewport.scene;
  camera = viewport.to2D();
  gui = viewport.gui.gui;
  
  initGUI();
  initScene();
  
  renderer.domElement.addEventListener('click', onClick, false)
}

export {
  main
}