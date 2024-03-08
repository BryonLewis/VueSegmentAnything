import { RouteLocationNormalized, createRouter, createWebHashHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import Login from '../views/Login.vue';
import Images from '../views/Images.vue';
import BasicSAM from '../views/BasicSAM.vue';
import GeoJSViewer from '../views/GeoJSViewer.vue';
import oauthClient from '../plugins/Oauth';

function beforeEach(
  to: RouteLocationNormalized,
  _: RouteLocationNormalized,
  next: (route?: string) => void,
) {
  if (!oauthClient.isLoggedIn && to.name !== 'Login') {
    next('/login');
    return;
  }  if (oauthClient.isLoggedIn && to.name === 'Login') {
    next('/');
  }
  next();
}


function routerInit(){
  const router  = createRouter({
    history: createWebHashHistory(),
    routes: [
      {
        path: '/',
        component: HomePage,
      },
      {
        path: '/login',
        name: 'Login',
        component: Login,
      },
      {
        path: '/images',
        name: 'Images',
        component: Images,
      },
      {
        path: '/image/:imageId/basic_sam',
        name: 'Image',
        component: BasicSAM,
        props: true,
      },
      {
        path: '/image/:imageId/geojs_sam',
        name: 'GeoJSViewer',
        component: GeoJSViewer,
        props: true,
      },
    ],
  });
  router.beforeEach(beforeEach);
  return router;
}

export default routerInit;
