/* eslint-disable no-unused-vars */
import * as THREE from "three";
import {TransformControls} from "three/examples/jsm/controls/TransformControls";
/**
 * Copyright (c) 2020-present, Inst.AAA.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Date: 2020-11-12
 * Author: Yichen Mo
 */
import {refreshSelection} from "@/creator/AssetManager";

/**
 * Transformer
 * @param _scene
 * @param _renderer
 * @param _camera
 * @constructor
 */
const Transformer = function (_scene, _renderer, _camera) {
  let control = null;
  let scope = this;
  let grouped;
  let selected = [];
  let dragged = false;
  let copy = 0;
  let refresh = false;
  //
  let clonedObject = new THREE.Group();
  let shiftDown;
  
  
  this.highlight = false;
  
  //API
  
  function addToInfoCard(o) {
    if (o !== undefined) {
      
      
      if (o.toInfoCard !== undefined) {
        o.toInfoCard();
        return;
      }
      window.InfoCard.info.uuid = o.uuid;
      window.InfoCard.info.position = o.position;
      window.InfoCard.info.model = {};
      window.InfoCard.info.properties = {type: o.type, matrix: o.matrix.elements};
      
    } else {
      // clear info card
      window.InfoCard.info.uuid = "uuid";
      window.InfoCard.info.position = {};
      window.InfoCard.info.model = {};
      window.InfoCard.info.properties = {};
    }
    
  }
  
  function toList(group) {
    if (group.isGroup) {
      return group.children;
    } else {
      return [group];
    }
  }
  
  function highlightCurrent(object) {
    if (object) {
      window.highlightObject = toList(object);
    } else {
      window.highlightObject = window.objects;
    }
  }
  
  // eslint-disable-next-line no-unused-vars
  function objectChanged(o) {
    // console.log(o)
  }
  
  // eslint-disable-next-line no-unused-vars
  function draggingChanged(o, event) {
    // event: true - dragging start, false - dragging end
    // console.log(o);
  }
  
  // eslint-disable-next-line no-unused-vars
  function deleteChanged(o) {
  
  }
  
  function init() {
    control = new TransformControls(_camera, _renderer.domElement);
    
    control.addEventListener('object-changed',
      function (event) {
        addToInfoCard(event.value);
        // highlightCurrent(control.object);
        if (control.object !== scope.object) {
          scope._assetManager.unHighlightList(window.highlightObject);
          scope.object = control.object;
        }
        if (control.object) {
          window.highlightObject = toList(control.object);
          if (scope.highlight)
            scope._assetManager.highlightList(window.highlightObject);
        } else {
          if (scope.highlight)
            scope._assetManager.unHighlightList(window.highlightObject);
          window.highlightObject = window.objects;
        }
        scope.objectChanged(control.object);
        
      });
    
    control.addEventListener('dragging-changed', function (event) {
      addDraggingFlag(scope.object, event.value);
      dragged = !event.value;
      
      
      if (event.value === true) {
        copy = 0;
        clonedObject = new THREE.Group();
        setCloneObject(control.object);
        if (scope.highlight)
          scope._assetManager.unHighlightList([clonedObject]);
        _renderer.domElement.style.cursor = 'pointer';
      } else {
        
        control.object.updateMatrix();
        addToInfoCard(control.object);
        
        if (copy % 2 === 1) {
          applyTransformGroup(clonedObject);
          while (clonedObject.children.length > 0) {
            clonedObject.children.forEach((item) => {
              _scene.attach(item)
            })
          }
          refresh = true;
        }
        _renderer.domElement.style.cursor = 'auto';
        copy = 0;
      }
      
      scope.draggingChanged(scope.object, event.value);
    });
    
    grouped = new THREE.Group();
    grouped.isTransformerGroup = true;
    _scene.add(grouped);
    
    _scene.add(control);
    _renderer.domElement.addEventListener('keydown', onDocumentKeyDown, false);
    _renderer.domElement.addEventListener('keyup', onDocumentKeyUp, false);
    _renderer.domElement.addEventListener('click', onClick, false);
  }
  
  function addDraggingFlag(object, flag) {
    if (!object.isGroup) {
      // console.log(object);
      object.dragging = flag;
      object.parent.dragging = flag;
    } else {
      for (let i = 0; i < object.children.length; ++i) {
        addDraggingFlag(object.children[i], flag);
      }
    }
  }
  
  function setCloneObject(object) {
    if (!object.isGroup) {
      const cloned = object.clone();
      if (object.toCamera) cloned.toCamera = true;
      if (object.layer !== undefined) cloned.layer = Array.from(object.layer);
      
      if (cloned.material) {
        if (cloned.material.length > 0) {
          let materials = []
          for (let i = 0; i < cloned.material.length; ++i) {
            materials.push(cloned.material[i].clone());
          }
          cloned.material = materials;
        } else {
          cloned.material = cloned.material.clone();
        }
      }
      clonedObject.add(cloned);
    } else {
      clonedObject.position.copy(object.position);
      for (let i = 0; i < object.children.length; ++i) {
        setCloneObject(object.children[i]);
      }
    }
  }
  
  
  function setFromIntersections(intersections) {
    let mesh = undefined;
    for (let i = 0; i < intersections.length; ++i) {
      let item = intersections[i].object;
      if (item.unselectable) continue;
      if (item.isMesh) {
        mesh = item;
        break;
      }
    }
    if (mesh !== undefined && mesh.parent.isGroup) {
      let group = mesh.parent;
      while (group.parent.isGroup)
        group = group.parent;
      
      applyGroupCenter(group);
      return group;
    }
    return mesh;
  }
  
  /**
   * @description click event
   * @param event
   */
  function onClick(event) {
    if (dragged) {
      dragged = !dragged;
      return;
    }
    
    const mouse = new THREE.Vector2(), raycaster = new THREE.Raycaster();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, control.camera);
    
    const intersections = raycaster.intersectObjects(window.objects, true);
    const intersected = setFromIntersections(intersections);
    
    /* ---------- drag frame contains objects ---------- */
    if (selected.length > 0) {
      selected.forEach((obj) => {
        if (obj.isGroup) {
          applyGroupCenter(obj);
        }
      })
      attachObject(selected);
      selected = [];
      return;
    }
    
    /* ---------- void selection ---------- */
    if (intersected === undefined) {
      if (shiftDown === true) return;
      
      clear();
      if (refresh) {
        refreshSelection(_scene);
        refresh = false;
      }
      if (scope._dragFrames !== undefined)
        scope._dragFrames.enabled = true;
      return;
    }
    
    /* ---------- shift add object ---------- */
    if (shiftDown) {
      if (control.object === undefined) {
        attachObject([intersected]);
      } else {
        if (control.object.isTransformerGroup) {
          const o = intersected;
          if (o.parent !== control.object) {
            o.position.x -= control.object.position.x;
            o.position.y -= control.object.position.y;
            control.object.add(o);
            applyGroupCenter(control.object);
          }
        } else {
          attachObject([control.object, intersected]);
        }
      }
      
      /* ---------- normal select ---------- */
    } else {
      clear();
      attachObject([intersected]);
      applyGroupCenter(control.object);
    }
  }
  
  
  function attachObject(objs) {
    if (objs.length === 1) {
      control.attach(objs[0]);
      
      if (scope._dragFrames !== undefined)
        scope._dragFrames.enabled = false;
      
    } else if (objs.length > 1) {
      
      for (let i = 0; i < objs.length; ++i) {
        grouped.add(objs[i]);
      }
      applyGroupCenter(grouped);
      control.attach(grouped);
      
      if (scope._dragFrames !== undefined)
        scope._dragFrames.enabled = false;
    }
  }
  
  
  function deleteObject(object) {
    if (object === undefined) return;
    
    if (!object.isGroup) {
      object.parent.remove(object);
      try {
        _scene.remove(object)
      } catch (e) {
        console.log(e)
      }
      scope.deleteChanged(object);
    } else {
      while (object.children.length > 0) {
        object.children.forEach((item) => {
          deleteObject(item);
        });
      }
    }
    
  }
  
  
  function setTransformSnap(ts, rs, ss) {
    scope.translateionSnap = ts ?? scope.translateionSnap;
    scope.rotationSnap = rs ?? scope.rotationSnap;
    scope.scaleSnap = ss ?? scope.scaleSnap;
    if (scope.snap) {
      control.setTranslationSnap(scope.translateionSnap);
      control.setRotationSnap(THREE.MathUtils.degToRad(scope.rotationSnap));
      control.setScaleSnap(scope.scaleSnap);
    } else {
      control.setTranslationSnap(null);
      control.setRotationSnap(null);
      control.setScaleSnap(null);
    }
  }
  
  function deleteSelected() {
    let obj = control.object;
    deleteObject(obj);
    
    clear();
    
    refreshSelection(_scene);
  }
  
  function onDocumentKeyDown(event) {
    switch (event.keyCode) {
      case 81: // Q
        if (scope.world === false) {
          scope.world = true;
          control.setSpace('world');
        } else {
          scope.world = false;
          control.setSpace('local');
        }
        break;
      
      case 87: // W
        control.setMode("translate");
        scope.mode = 0;
        break;
      
      case 69: // E
        control.setMode("rotate");
        scope.mode = 1;
        break;
      
      case 82: // R
        control.setMode("scale");
        scope.mode = 2;
        break;
      
      case 83: // S
        scope.snap = !scope.snap;
        setTransformSnap();
        break;
      
      case 187:
      case 107: // +, =, num+
        control.setSize(control.size + 0.1);
        break;
      
      case 189:
      case 109: // -, _, num-
        control.setSize(Math.max(control.size - 0.1, 0.1));
        break;
      
      case 18:// alt
        if (_renderer.domElement.style.cursor !== 'auto') {
          copy++;
          if (copy % 2 === 1) {
            _renderer.domElement.style.cursor = 'move';
          } else {
            _renderer.domElement.style.cursor = 'pointer';
          }
        }
        break;
      
      case 32: // space bar
        clear();
        
        break;
      
      case 68: // D
      case 46: // delete
        deleteSelected();
        
        break;
      
      case 16: // shift
        shiftDown = true;
    }
    
  }
  
  function onDocumentKeyUp(event) {
    switch (event.keyCode) {
      case 16: // shift
        shiftDown = false;
    }
  }
  
  function addGUI(gui) {
    let transformer = gui.addFolder('Transformer');
    transformer.open();
    
    transformer.add(scope, 'mode').min(0).max(2).step(1)
      .listen().onChange(function () {
      switch (scope.mode) {
        case 0:
          control.setMode("translate");
          break;
        case 1:
          control.setMode("rotate");
          break;
        case 2:
          control.setMode("scale");
          break;
      }
    });
    
    transformer.add(scope, 'world')
      .listen().onChange(function () {
      control.setSpace(scope.world === true ? "world" : "local");
    });
    
    transformer.add(scope, 'snap')
      .listen().onChange(function () {
      setTransformSnap();
      
    });
  
    transformer.add(scope, 'deleteSelected').name('delete');
    transformer.add(scope, 'setCenter').name('center');
  }
  
  function setSelected(objects) {
    selected = objects;
  }
  
  function setCamera(camera) {
    control.camera = camera;
  }
  
  function clear() {
    applyTransformGroup(control.object);
  
    control.detach();
  
    while (grouped.children.length > 0) {
      grouped.children.forEach((item) => {
        _scene.attach(item);
      });
    }
  }
  
  this.setCenter = function () {
    applyGroupCenter(control.object, true);
  }
  
  init();
  
  this.mode = 0; // 0-transform, 1-rotate, 2-scale
  this.world = false; //true-word, false-local
  this.snap = false;
  
  this.object = control.object;
  this.control = control;
  this.addGUI = addGUI;
  
  this.setSelected = setSelected;
  this.setCamera = setCamera;
  
  this.applyTransform = applyTransformGroup;
  this.clear = clear;
  this.deleteSelected = deleteSelected;
  
  this.highlightCurrent = highlightCurrent;
  this.objectChanged = objectChanged;
  this.draggingChanged = draggingChanged;
  this.deleteChanged = deleteChanged;
  
  this.setTransformSnap = setTransformSnap;
  this.translateionSnap = 100;
  this.rotationSnap = 15;
  this.scaleSnap = 0.25;
  
  this.isTransformer = true;
}


function applyGroupCenter(group) {
  let box = new THREE.Box3().setFromObject(group);
  let c = new THREE.Vector3();
  box.getCenter(c);
  c = c.sub(group.position);
  group.translateX(c.x);
  group.translateY(c.y);
  
  group.children.forEach((item) => {
    item.position.x -= c.x;
    item.position.y -= c.y;
  });
  if (group.geometry) {
    group.geometry.translate(-c.x, -c.y, 0);
  }
  
}

/**
 * Apply Transformation to children in group
 * The matrix on three will be clear
 * @param object : THREE.Group
 */
function applyTransformGroup(object) {
  if (object !== undefined && object.isGroup) {
    
    object.matrixAutoUpdate = false;
    
    setChildQuaternion(object, object.quaternion);
    setChildPosition(object, object.position);
    setChildScale(object, object.scale);
    
    object.position.set(0, 0, 0);
    object.quaternion.set(0, 0, 0, 1);
    object.scale.set(1, 1, 1);
    
    object.updateMatrixWorld(true);
    object.matrixAutoUpdate = true;
    
  }
}

function setChildScale(object, scale) {
  if (!object.isGroup) {
    object.scale.multiply(scale);
    object.position.multiply(scale);
    object.updateMatrixWorld(true);
    return;
  }
  
  for (let i = 0; i < object.children.length; ++i) {
    const child = object.children[i];
    child.scale.multiply(scale);
    child.position.multiply(scale);
    child.updateMatrixWorld(true);
  }
}


function setChildPosition(object, position) {
  if (!object.isGroup) {
    object.position.add(position);
    object.updateMatrixWorld(true);
    return;
  }
  for (let i = 0; i < object.children.length; ++i) {
    const child = object.children[i];
    child.position.add(position);
    child.updateMatrixWorld(true);
  }
}

function setChildQuaternion(object, quaternion) {
  if (!object.isGroup) {
    object.quaternion.premultiply(quaternion);
    object.position.applyQuaternion(quaternion);
    
    object.updateMatrixWorld(true);
    return;
  }
  for (let i = 0; i < object.children.length; ++i) {
    const child = object.children[i];
    child.quaternion.premultiply(quaternion);
    child.position.applyQuaternion(quaternion);
    
    child.updateMatrixWorld(true);
  }
}

export {Transformer, applyGroupCenter, applyTransformGroup};