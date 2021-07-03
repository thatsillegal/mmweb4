/* eslint-disable no-unused-vars,no-case-declarations */

import * as ARCH from "@/archiweb"
import * as THREE from "three";

import {LineGeometry} from "three/examples/jsm/lines/LineGeometry";
import {LineMaterial} from "three/examples/jsm/lines/LineMaterial";
import {Line2} from "three/examples/jsm/lines/Line2";

let scene, renderer, gui, camera, gb;
let material = new LineMaterial({
  color: 0xffffff,
  linewidth: 25,
  vertexColors: true,
  dashed: false,
  alphaToCoverage: true,
});

/* ---------- GUI setup ---------- */


function stringSegments(c, s, mod) {
  
  const positions = [];
  const colors = [];
  for (let i = 0; i < s.length; ++i) {
    let p1 = c[(s.charCodeAt(i) - 97) % mod].position;
    // let p2 = c[(s.charCodeAt(i+1) - 97)%mod].position
    positions.push(p1.x, p1.y, p1.z);
    colors.push(0.1, 0.1, 0.1);
  }
  const geometry = new LineGeometry();
  geometry.setPositions(positions);
  geometry.setColors(colors)
  
  let line = new Line2(geometry, material);
  line.computeLineDistances();
  line.scale.set(1, 1, 1);
  scene.add(line);
}


/* ---------- create your scene object ---------- */
function initScene() {
  scene.background = new THREE.Color('#e6e6e6');
  
  // refresh global objects
  gb = new ARCH.GeometryFactory(scene);
  let mt = new ARCH.MaterialFactory();
  
  const light = new THREE.SpotLight(0xffffff, 1.5);
  light.position.set(0, 0, 1000);
  scene.add(light);
  
  let num = 12;
  let portion = Math.PI / num * 2;
  let radius = 300;
  let circles = [];
  for (let i = 0; i < num; ++i) {
    let color = new THREE.Color().setHSL(i / num, 0.6, 0.6).getHex();
    circles.push(gb.Cylinder([
        radius * Math.sin(i * portion),
        radius * Math.cos(i * portion),
        0],
      [10, 10],
      mt.Matte(color)));
  }
  
  let title = ["archiweb"];
  title.forEach((s) => stringSegments(circles, s, num));
  
  circles.forEach((it) => it.visible = false);
  //
  ARCH.refreshSelection(scene);
}


/* ---------- animate per frame ---------- */
function draw() {
  material.resolution.set(window.innerWidth, window.innerHeight);
  
}


/* ---------- main entry ---------- */
function main() {
  const viewport = new ARCH.Viewport();
  renderer = viewport.renderer;
  scene = viewport.scene;
  gui = viewport.gui;
  camera = viewport.to2D();
  viewport.disableGUI();
  
  initScene();
  
  viewport.draw = draw;
}

export {
  main
}