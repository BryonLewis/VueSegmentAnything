<script lang="ts">
import { defineComponent, inject, ref, onMounted, computed, watch } from "vue";
import OAuthClient from "@girder/oauth-client";
import { useRoute, useRouter } from "vue-router";

export default defineComponent({
  setup() {
    const oauthClient = inject<OAuthClient>("oauthClient");
    const router = useRouter();
    const route = useRoute();
    if (oauthClient === undefined) {
      throw new Error('Must provide "oauthClient" into component.');
    }

    const loginText = ref("Login");
    const checkLogin = () => {
      if (oauthClient.isLoggedIn) {
        loginText.value = "Logout";
      } else {
        loginText.value = "Login";
      }
    };
    const logInOrOut = async () => {
      if (oauthClient.isLoggedIn) {
        await oauthClient.logout();
        localStorage.clear();
        router.push("Login");
        checkLogin();
      } else {
        oauthClient.redirectToLogin();
      }
    };
    onMounted(() => {
      checkLogin();
    });
    router.afterEach((guard) => {
      if (guard.path.includes("images")) {
        activeTab.value = "images";
      }
    });
    const activeTab = ref(route.path.includes("images") ? "images" : "");

    return { oauthClient, loginText, logInOrOut, activeTab };
  },
});
</script>

<template>
  <v-app id="app">
    <v-app-bar app>
      <v-tabs
        v-if="oauthClient.isLoggedIn"
        v-model="activeTab"
        fixed-tabs
      >
        <v-tab
          to="/"
          value="home"
        >
          Home
        </v-tab>
        <v-tab
          to="/images"
          value="images"
        >
          Images
        </v-tab>
      </v-tabs>
      <v-spacer />
      <v-btn @click="logInOrOut">
        {{ loginText }}
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<style >
html {
  overflow-y:hidden;
}
</style>