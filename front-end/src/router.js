import Vue from 'vue'
import VueRouter from 'vue-router'
import Viewer from './components/Viewer'
import Home from './components/Home'
import Map from './components/Map'

const examples = [
  // test examples
  'polygon-handles', 'csg',
  // website examples
  '2d-editor', '3d-editor', 'loaders-example',
  'marching-cubes', 'material-example', 'shape-2d',
  'undo-redo-canvas', 'image-3d', 'java-backend-example',
  'archijson-geometry', 'interactive-spanning-tree',
  'cascaded-shadow-maps', 'python-backend-example', 'mapbox-buildings',
  'logo'

]
const routes = [];
examples.forEach((item) => {
  let res = item.split('-');
  for (let i = 0; i < res.length; ++i) {
    res[i] = res[i].replace(/^\S/, s => s.toUpperCase());
  }
  let title = res.join(' ');
  let compo = (item.indexOf('mapbox') !== -1) ? Map : Viewer;
  routes.push({
    path: '/' + item,
    name: item,
    component: compo,
    props: () => {
      window.currentApp = item
    },
    meta: {title: 'ArchiWeb ' + title}
  })
})

routes.push(
  {path: '/', name: 'index', component: Viewer, meta: {title: 'App'}},
  // {path: '/', name: 'map', component: Map, meta: {title: 'Map'}},
  {path: '/archiweb', name: 'home', component: Home, meta: {title: 'ArchiWeb'}}
)

Vue.use(VueRouter)

const router = new VueRouter({
  routes
})
// eslint-disable-next-line no-unused-vars
router.afterEach((to, from) => {
  // Use next tick to handle router history correctly
  // see: https://github.com/vuejs/vue-router/issues/914#issuecomment-384477609
  Vue.nextTick(() => {
    document.title = to.meta.title || 'ArchiWeb';
  });
});
export {
  router as default,
  examples
}
