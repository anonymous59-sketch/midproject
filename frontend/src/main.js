import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import store from "./store";
import routes from "./router";
import ArgonDashboard from "./argon-dashboard";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/scss/argon-dashboard.scss";
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";
import { useAuthStore } from "@/store/auth";

const appInstance = createApp(App);

// Pinia 생성 -> 앱 시작 시 로그인 상태 복구(새로고침 대비)
const pinia = createPinia();
appInstance.use(pinia);
useAuthStore(pinia).hydrateFromStorage();

appInstance.use(store);
appInstance.use(routes);
appInstance.use(ArgonDashboard);
appInstance.mount("#app");
