import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/scss/argon-dashboard.scss"; // 파일명/경로는 프로젝트에 맞게
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";

const appInstance = createApp(App);
appInstance.use(createPinia());
appInstance.use(store);
appInstance.use(router);
appInstance.use(ArgonDashboard);
appInstance.mount("#app");
createApp(App).use(router).mount("#app");
