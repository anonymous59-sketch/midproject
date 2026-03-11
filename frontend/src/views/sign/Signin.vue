<script setup>
import { onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/store/auth";

import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import FindIdModal from "@/views/modal/FindIdModal.vue";
import FindPasswordModal from "@/views/modal/FindPasswordModal.vue";
import AlertModal from "@/views/modal/AlertModal.vue";

const store = useStore();
const router = useRouter();
const route = useRoute();
const body = document.body;

const userId = ref("");
const password = ref("");
const showFindIdModal = ref(false);
const showFindPasswordModal = ref(false);

const goToSignUp = () => router.push("/signup");
const goToFindId = () => {
  showFindIdModal.value = true;
};
const goToResetPassword = () => {
  showFindPasswordModal.value = true;
};

function onFindIdGoLogin() {
  showFindIdModal.value = false;
}
function onFindIdGoFindPassword() {
  showFindIdModal.value = false;
  showFindPasswordModal.value = true;
}
function onFindPasswordGoLogin() {
  showFindPasswordModal.value = false;
}

const authStore = useAuthStore();

onMounted(() => {
  const open = route.query.open;
  if (open === "find-id") showFindIdModal.value = true;
  else if (open === "find-password") showFindPasswordModal.value = true;
});

const alertModal = ref({
  show: false,
  type: "success",
  title: "알림",
  message: "",
});
function showAlert(type, title, message) {
  alertModal.value = {
    show: true,
    type,
    title: title ?? "알림",
    message: message ?? "",
  };
}

const handleLogin = async () => {
  if (!userId.value || !password.value) {
    showAlert("error", "알림", "ID와 Password를 입력해주세요.");
    return;
  }
  try {
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ m_id: userId.value, m_pw: password.value }),
    });
    const data = await res.json();

    if (data.success) {
      switch (data.user.m_auth) {
        case "a0_21":
        case "a0_31":
        case "a0_41":
          showAlert("info", "알림", "가입 승인 대기 상태입니다.");
          return;
      }
      authStore.setAuth({ token: data.token, user: data.user });
      sessionStorage.setItem("token", data.token || "");
      sessionStorage.setItem("user", JSON.stringify(data.user));

      switch (data.user.m_auth) {
        case "a0_20":
          router.push("/applicant");
          break;
        case "a0_30":
          router.push("/manager");
          break;
        case "a0_40":
          router.push("/organmanager");
          break;
        case "a0_99":
          router.push("/admin");
          break;
        default:
          router.push("/");
          break;
      }
    } else {
      showAlert("error", "알림", data.message ?? "로그인에 실패했습니다.");
    }
  } catch (err) {
    console.error(err);
    showAlert("error", "알림", "서버 오류가 발생했습니다.");
  }
};

onBeforeMount(() => {
  store.state.hideConfigButton = true;
  store.state.showNavbar = false;
  store.state.showSidenav = false;
  store.state.showFooter = false;
  body.classList.remove("bg-gray-100");
});

onBeforeUnmount(() => {
  store.state.hideConfigButton = false;
  store.state.showNavbar = true;
  store.state.showSidenav = true;
  store.state.showFooter = true;
  body.classList.add("bg-gray-100");
});
</script>

<template>
  <main class="login-page-bg">
    <!-- 좌측 이미지 카드 -->
    <div class="left-image-card"></div>

    <!-- 우측 로그인 카드 (이미지 카드 위에 겹치도록) -->
    <div class="right-card">
      <div class="card shadow-lg rounded-4 p-5 login-card">
        <!-- 큰 제목 -->
        <h1 class="text-center fw-bold mb-3">발달장애인 지원 프로그램</h1>

        <!-- 설명 텍스트 -->
        <p class="text-center text-muted mb-4">
          서비스 이용을 위해 로그인해 주세요.
        </p>

        <!-- 로그인 폼 -->
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="userid" class="form-label">ID</label>
            <ArgonInput
              v-model="userId"
              id="userid"
              type="text"
              placeholder="ID"
              size="lg"
              class="rounded-1"
            />
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">비밀번호</label>
            <ArgonInput
              v-model="password"
              id="password"
              type="password"
              placeholder="Password"
              size="lg"
              class="rounded-1"
            />
          </div>

          <ArgonButton
            type="submit"
            variant="gradient"
            color="success"
            fullWidth
            size="lg"
            class="rounded-1 py-2 mb-4"
          >
            로그인
          </ArgonButton>
        </form>

        <!-- 하단 버튼들 -->
        <div
          class="d-flex flex-wrap justify-content-center gap-2 gap-md-3 pt-2 border-top"
        >
          <ArgonButton
            type="button"
            variant="outline"
            color="success"
            size="sm"
            class="rounded-1"
            @click="goToFindId"
          >
            아이디 찾기
          </ArgonButton>
          <ArgonButton
            type="button"
            variant="outline"
            color="success"
            size="sm"
            class="rounded-1"
            @click="goToResetPassword"
          >
            비밀번호 찾기
          </ArgonButton>
          <ArgonButton
            type="button"
            variant="outline"
            color="success"
            size="sm"
            class="rounded-1"
            @click="goToSignUp"
          >
            회원가입
          </ArgonButton>
        </div>
      </div>
    </div>

    <!-- 모달 -->
    <FindIdModal
      :show="showFindIdModal"
      @close="showFindIdModal = false"
      @go-login="onFindIdGoLogin"
      @go-find-password="onFindIdGoFindPassword"
    />
    <FindPasswordModal
      :show="showFindPasswordModal"
      @close="showFindPasswordModal = false"
      @go-login="onFindPasswordGoLogin"
    />

    <!-- 알림 모달 -->
    <AlertModal
      :show="alertModal.show"
      :type="alertModal.type"
      :title="alertModal.title"
      :message="alertModal.message"
      @close="alertModal.show = false"
    />
  </main>
</template>

<style scoped>
.login-page-bg {
  position: relative;
  width: 100%;
  height: 100vh; /* 스크롤 제거 */
  background-color: #f2f3f5;
  overflow: hidden;
}

/* 좌측 이미지 카드 */
.left-image-card {
  position: absolute;
  top: 20px; /* 위쪽 여백 */
  left: 20px; /* 좌측 여백 */
  width: 55%; /* 좌우 넓힘 */
  height: calc(100% - 40px); /* 하단 40px 잘림 */
  border-radius: 1rem;
  background-image: url("https://www.ibabynews.com/news/photo/202108/96894_46682_4928.jpg");
  background-size: cover;
  background-position: center;
  z-index: 1;
}

/* 우측 로그인 카드 */
.right-card {
  position: absolute;
  top: 50%;
  right: 10%; /* 화면 기준 오른쪽 영역 중앙 위치 */
  transform: translateY(-50%);
  width: 490px;
  z-index: 2; /* 이미지 카드 위로 표시 */
  display: flex;
  justify-content: center;
}

/* 로그인 카드 내부 */
.login-card {
  box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.25);
  border-radius: 1rem;
  background-color: #fff;
}

/* 제목, 폰트 조정 */
h1 {
  font-size: 2rem;
  line-height: 1.2;
}
p {
  font-size: 1rem;
}

@media (max-width: 992px) {
  .left-image-card {
    display: none;
  }
  .right-card {
    position: static;
    transform: none;
    width: 100%;
    padding: 2rem 0;
  }
  .login-card {
    width: 100%;
    padding: 2rem;
  }
}
</style>
