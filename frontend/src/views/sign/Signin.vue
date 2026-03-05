<script setup>
import { onBeforeMount, onBeforeUnmount, ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";

import Navbar from "@/examples/PageLayout/Navbar.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonSwitch from "@/components/ArgonSwitch.vue";
import ArgonButton from "@/components/ArgonButton.vue";

// Vuex, Router
const store = useStore();
const router = useRouter();
const body = document.body;

// 폼 입력 상태
const userId = ref("");
const password = ref("");
const rememberMe = ref(false);

// 라우터 이동 함수
const goToSignUp = () => router.push("/signup");
const goToFindId = () => router.push("/find-id");
const goToResetPassword = () => router.push("/find-password");

// 로그인 저장소 피니아
const authStore = useAuthStore();

// 모달 상태
const showModal = ref(false);
const modalMessage = ref("");

// 로그인 처리
const handleLogin = async () => {
  if (!userId.value || !password.value) {
    alert("ID와 Password를 입력해주세요.");
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
          modalMessage.value = "가입 승인 대기 상태입니다.";
          showModal.value = true;
          return; // 🔥 여기서 종료
      }
      // ✅ Pinia에 전체 user + token 저장
      authStore.setAuth({
        token: data.token,
        user: data.user,
      });

      // 새로고침 유지용(탭 단위): sessionStorage에는 항상 저장
      sessionStorage.setItem("token", data.token || "");
      sessionStorage.setItem("user", JSON.stringify(data.user));

      // localStorage 저장 (자동로그인용: rememberMe 체크 시)
      if (rememberMe.value) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // alert("로그인 성공!");

      // ✅ 권한별 분기
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
      }
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류가 발생했습니다.");
  }
};

// 페이지 진입/퇴장 시 UI 상태 처리
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
  <!-- Navbar (로그인 페이지에서는 숨김 가능) -->
  <div
    v-if="store.state.showNavbar"
    class="container top-0 position-sticky z-index-sticky"
  >
    <div class="row">
      <div class="col-12">
        <navbar
          isBlur="blur border-radius-lg my-3 py-2 start-0 end-0 mx-4 shadow"
          v-bind:darkMode="true"
          isBtn="bg-gradient-success"
        />
      </div>
    </div>
  </div>

  <main class="mt-0 main-content">
    <section>
      <div class="page-header min-vh-100">
        <div class="container">
          <div class="row">
            <!-- 로그인 카드 -->
            <div
              class="mx-auto col-xl-4 col-lg-5 col-md-7 d-flex flex-column ms-auto me-lg-5 position-relative z-index-2"
            >
              <div class="card bg-white shadow-lg rounded-0 p-4">
                <div
                  class="pb-0 card-header text-start bg-transparent border-0"
                >
                  <h4 class="font-weight-bolder">안녕하세요</h4>
                  <p class="mb-0">로그인해주세요.</p>
                </div>

                <div class="card-body">
                  <form @submit.prevent="handleLogin">
                    <!-- ID -->
                    <div class="mb-3">
                      <argon-input
                        v-model="userId"
                        id="userid"
                        type="text"
                        placeholder="ID"
                        name="userid"
                        class="rounded-0 py-3"
                      />
                      <div class="text-end mt-1">
                        <argon-button
                          type="button"
                          variant="gradient"
                          color="success"
                          class="rounded-0 py-1 px-3"
                          size="sm"
                          @click="goToFindId"
                          >아이디 찾기</argon-button
                        >
                      </div>
                    </div>

                    <!-- Password -->
                    <div class="mb-3">
                      <argon-input
                        v-model="password"
                        id="password"
                        type="password"
                        placeholder="Password"
                        name="password"
                        class="rounded-0 py-3"
                      />
                      <div class="text-end mt-1">
                        <argon-button
                          type="button"
                          variant="gradient"
                          color="success"
                          class="rounded-0 py-1 px-3"
                          size="sm"
                          @click="goToResetPassword"
                          >비밀번호 재설정</argon-button
                        >
                      </div>
                    </div>

                    <!-- Remember me -->
                    <argon-switch
                      v-model="rememberMe"
                      id="rememberMe"
                      name="remember-me"
                    >
                      Remember me
                    </argon-switch>

                    <!-- 버튼 -->
                    <div class="d-flex gap-3 mt-4">
                      <argon-button
                        type="submit"
                        variant="gradient"
                        color="success"
                        fullWidth
                        class="rounded-0 py-2"
                        >로그인</argon-button
                      >

                      <argon-button
                        type="button"
                        variant="outline"
                        color="success"
                        fullWidth
                        class="rounded-0 py-2"
                        @click="goToSignUp"
                        >회원가입</argon-button
                      >
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <!-- 배경 이미지 -->
            <div
              class="top-0 my-auto text-center col-12 d-lg-flex d-none h-100 ps-0 position-absolute start-0 justify-content-center flex-column"
            >
              <div
                class="position-relative bg-gradient-primary h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center overflow-hidden"
                style="
                  background-image: url(&quot;https://www.ibabynews.com/news/photo/202108/96894_46682_4928.jpg&quot;);
                  background-size: cover;
                  background-repeat: no-repeat;
                  background-position: center;
                "
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- 모달: 알림 -->
    <div
      v-if="showModal"
      class="modal fade show d-block"
      style="background: rgba(0, 0, 0, 0.5); z-index: 9999"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-0 border-0 shadow-lg">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title font-weight-bolder">알림</h5>
          </div>
          <div class="modal-body py-4 text-center text-dark font-weight-bold">
            {{ modalMessage }}
          </div>
          <div class="modal-footer border-0 pt-0 justify-content-center">
            <argon-button
              color="success"
              variant="gradient"
              class="rounded-0 px-5"
              @click="showModal = false"
              >확인</argon-button
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 화면 맨 아래 고정되는 외부 링크 바 -->
    <!-- 화면 맨 아래 고정되는 외부 링크 바 -->
<div class="position-absolute bottom-0 start-0 w-100 z-index-3 pb-4">
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-lg-6 text-center">
        <div
          class="d-flex justify-content-center gap-4 p-2 rounded-3"
          style="background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);"
        >
          <!-- Google -->
          <a
            href="https://www.google.com"
            target="_blank"
            class="external-icon"
          >
            <i class="fa-brands fa-google"></i>
          </a>

          <!-- Naver -->
          <a
            href="https://www.naver.com"
            target="_blank"
            class="external-icon"
          >
            <i class="fa-solid fa-n"></i>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
  </main>
</template>

