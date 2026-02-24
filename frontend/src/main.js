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

const appInstance = createApp(App);
appInstance.use(createPinia());
appInstance.use(store);
appInstance.use(routes);
appInstance.use(ArgonDashboard);
appInstance.mount("#app");
