<script setup>
import { onBeforeUnmount, onBeforeMount } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";

const body = document.getElementsByTagName("body")[0];
const store = useStore();
const router = useRouter();

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

const goToLogin = () => {
  router.push("/signin");
};

const handleResetPassword = () => {
  // 실제 비밀번호 변경 API 로직이 들어갈 자리입니다.
  alert("비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.");
  router.push("/signin");
};
</script>

<template>
  <main class="mt-0 main-content">
    <section>
      <div
        class="page-header min-vh-100"
        style="
          background-image: url(&quot;https://www.ibabynews.com&quot;);
          background-size: cover;
          background-position: center;
        "
      >
        <span class="mask bg-gradient-dark opacity-6"></span>
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-xl-4 col-lg-5 col-md-7">
              <div class="card bg-white shadow-lg rounded-0 p-4 z-index-2">
                <div
                  class="pb-0 card-header text-center bg-transparent border-0"
                >
                  <h4 class="font-weight-bolder">비밀번호 재설정</h4>
                  <p class="mb-0 text-sm">새로운 비밀번호를 입력해주세요.</p>
                </div>
                <div class="card-body">
                  <form role="form" @submit.prevent="handleResetPassword">
                    <!-- 새 비밀번호 입력 -->
                    <div class="mb-3">
                      <label class="form-label text-sm">새 비밀번호</label>
                      <argon-input
                        type="password"
                        placeholder="새 비밀번호를 입력하세요"
                        name="password"
                        size="lg"
                        class="rounded-0"
                      />
                    </div>

                    <!-- 새 비밀번호 확인 -->
                    <div class="mb-3">
                      <label class="form-label text-sm">비밀번호 확인</label>
                      <argon-input
                        type="password"
                        placeholder="비밀번호를 한번 더 입력하세요"
                        name="confirmPassword"
                        size="lg"
                        class="rounded-0"
                      />
                    </div>

                    <div class="text-center mt-4">
                      <argon-button
                        fullWidth
                        variant="gradient"
                        color="success"
                        class="rounded-0 py-2 mb-3"
                        size="lg"
                      >
                        비밀번호 변경하기
                      </argon-button>

                      <argon-button
                        type="button"
                        fullWidth
                        variant="outline"
                        color="secondary"
                        class="rounded-0 py-2"
                        size="lg"
                        @click="goToLogin"
                      >
                        취소 및 로그인 화면으로
                      </argon-button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
