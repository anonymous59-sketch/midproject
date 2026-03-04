// stores/auth.js
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: null,
    user: null, // 전체 user 객체 저장
    isLoggedIn: false,
  }),

  getters: {
    userName: (state) => state.user?.m_nm || "",
    userAuth: (state) => state.user?.m_auth || "",
    isAdmin: (state) => state.user?.m_auth === "a0_99",
    isManager: (state) =>
      state.user?.m_auth === "a0_40" ||
      state.user?.m_auth === "a0_30",
  },

  actions: {
    // localStorage/sessionStorage -> Pinia 복구 (새로고침 대비)
    hydrateFromStorage() {
      if (this.isLoggedIn && this.user) return;

      const read = (storage) => {
        try {
          const token = storage.getItem("token");
          const userRaw = storage.getItem("user");
          const user = userRaw ? JSON.parse(userRaw) : null;
          return { token, user };
        } catch (e) {
          return { token: null, user: null };
        }
      };

      // rememberMe면 localStorage에, 아니면 sessionStorage에 저장하도록 맞춰 복구도 우선순위 적용
      const fromLocal = read(localStorage);
      const fromSession = read(sessionStorage);
      const token = fromLocal.token || fromSession.token || null;
      const user = fromLocal.user || fromSession.user || null;

      if (user) {
        this.token = token;
        this.user = user;
        this.isLoggedIn = true;
      }
    },

    setAuth(data) {
      this.token = data.token;
      this.user = data.user;
      this.isLoggedIn = true;
    },

    logout() {
      this.token = null;
      this.user = null;
      this.isLoggedIn = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    },
  },
});