/* eslint-disable no-unused-vars,no-case-declarations */

import * as ARCH from "@/archiweb";

let scene, renderer, gui, camera;
let gf, mt, am;
let stairs = [];

/* ---------- GUI setup ---------- */
function initGUI() {
  gui.gui.add(stairpara, "w", 100, 500, 30).onChange(function () {
    stairs.forEach((ele) => {
      ele.scale.x = stairpara.w;
    })
  });
  gui.gui.add(stairpara, "h", 10, 100, 5).onChange(function () {
    stairs.forEach((ele) => {
      ele.scale.z = stairpara.h;
    })
  });
}

let stairpara = {
  w: 300,
  h: 50,
}

/* ---------- create your scene object ---------- */
function initScene() {
  gf = new ARCH.GeometryFactory(scene);
  mt = new ARCH.MaterialFactory();
  
  
  for (let i = 0; i < 10; ++i) {
    stairs.push(gf.Cuboid([0, i * 50, i * 30], [300, 50, 50], mt.Matte()));
  }
  for (let i = 0; i < 10; ++i) {
    stairs.push(gf.Cuboid([300, 450 - i * 50, i * 30 + 330], [300, 50, 50], mt.Matte()));
  }
  gf.Cuboid([150, 650, 300], [600, 350, 50], mt.Matte());
  
  // refresh global objects
  am.addSelection(stairs, 1);
  am.refreshSelection(scene);
}

function updateObject(uuid, model) {
  const o = scene.getObjectByProperty('uuid', uuid);
  o.updateModel(o, model);
}

/* ---------- animate per frame ---------- */
function draw() {
  // box.position.x += 1;
}


/* ---------- main entry ---------- */
function main() {
  const viewport = new ARCH.Viewport();
  renderer = viewport.renderer;
  scene = viewport.scene;
  gui = viewport.gui;
  camera = viewport.camera;
  
  am = viewport.enableAssetManager();
  viewport.enableDragFrames();
  let tr = viewport.enableTransformer();
  tr.highlight = true;
  tr.snap = true;
  
  let sb = viewport.enableSceneBasic();
  sb.x = -1;
  sb.update();
  
  initGUI();
  initScene();
  
  viewport.draw = draw;
  
}

export {
  main,
  updateObject
}
