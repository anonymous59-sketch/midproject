import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/scss/argon-dashboard.scss"; // 파일명/경로는 프로젝트에 맞게
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";

createApp(App).use(router).mount("#app");
