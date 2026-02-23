<script setup>
import { onBeforeUnmount, onBeforeMount } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import Navbar from "@/examples/PageLayout/Navbar.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonSwitch from "@/components/ArgonSwitch.vue";
import ArgonButton from "@/components/ArgonButton.vue";

const body = document.getElementsByTagName("body")[0];
const store = useStore();
const router = useRouter();

const goToSignUp = () => {
  router.push("/signup");
};
const goToFindId = () => {
  router.push("/find-id"); // 라우터 경로 설정
};
const goToResetPassword = () => {
  router.push("/find-password");
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
                  <form role="form">
                    <div class="mb-3">
                      <argon-input
                        id="userid"
                        type="text"
                        placeholder="ID"
                        name="userid"
                        class="rounded-0 py-3"
                      />
                      <div class="text-end mt-0">
                        <argon-button
                          type="button"
                          variant="gradient"
                          color="success"
                          class="rounded-0 py-1 px-3"
                          size="sm"
                          @click="goToFindId"
                          >아이디찾기</argon-button
                        >
                      </div>
                    </div>
                    <div class="mb-3">
                      <argon-input
                        id="password"
                        type="password"
                        placeholder="Password"
                        name="password"
                        class="rounded-0 py-3"
                      />
                      <div class="text-end mt-0">
                        <argon-button
                          type="button"
                          variant="gradient"
                          color="success"
                          class="rounded-0 py-1 px-3"
                          size="sm"
                          @click="goToResetPassword"
                          >비밀번호찾기</argon-button
                        >
                      </div>
                    </div>
                    <argon-switch id="rememberMe" name="remember-me"
                      >Remember me</argon-switch
                    >

                    <div class="d-flex gap-3 mt-4">
                      <argon-button
                        variant="gradient"
                        color="success"
                        fullWidth
                        class="rounded-0 py-2"
                        >로그인</argon-button
                      >
                      <argon-button
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
                <div
                  class="px-1 pt-0 text-center card-footer px-lg-2 bg-transparent border-0"
                >
                  <p class="mx-auto mb-4 text-sm">
                    Don't have an account?
                    <a
                      href="javascript:;"
                      class="text-success text-gradient font-weight-bold"
                      >Sign up</a
                    >
                  </p>
                </div>
              </div>
            </div>
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
    <!-- 화면 맨 아래 고정되는 외부 링크 바 -->
    <div class="position-absolute bottom-0 start-0 w-100 z-index-3 pb-4">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-6 text-center">
            <div class="d-flex justify-content-center gap-3">
              <!-- 외부 사이트 버튼 1 -->
              <a
                href="https://www.google.com"
                target="_blank"
                class="btn btn-outline-white rounded-0 py-2 px-4 text-white border-white"
                >구글 바로가기</a
              >

              <!-- 외부 사이트 버튼 2 -->
              <a
                href="https://www.naver.com"
                target="_blank"
                class="btn btn-outline-white rounded-0 py-2 px-4 text-white border-white"
                >네이버 바로가기</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
