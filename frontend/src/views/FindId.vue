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

// 페이지 이동 함수
const goToLogin = () => {
  router.push("/signin"); // 라우터 설정에 맞춘 로그인 경로
};

// 인증번호 발송 로직
const sendVerificationCode = () => {
  alert("입력하신 이메일로 인증번호가 발송되었습니다.");
};

// 인증번호 확인 로직
const confirmVerificationCode = () => {
  alert("인증번호가 확인되었습니다.");
};

// 최종 아이디 찾기 실행
const handleFindId = () => {
  alert("아이디 찾기 프로세스를 진행합니다.");
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
                  <h4 class="font-weight-bolder">아이디 찾기</h4>
                  <p class="mb-0 text-sm">
                    가입 시 등록한 정보를 입력해주세요.
                  </p>
                </div>
                <div class="card-body">
                  <form role="form" @submit.prevent="handleFindId">
                    <!-- 이름 입력 -->
                    <div class="mb-3">
                      <label class="form-label text-sm">이름</label>
                      <argon-input
                        type="text"
                        placeholder="성함을 입력하세요"
                        name="name"
                        size="lg"
                        class="rounded-0"
                      />
                    </div>

                    <!-- 이메일 입력 + 인증번호 발송 버튼 -->
                    <div class="mb-3">
                      <label class="form-label text-sm">등록된 이메일</label>
                      <div class="d-flex gap-2">
                        <argon-input
                          id="email"
                          type="email"
                          placeholder="example@mail.com"
                          name="email"
                          size="lg"
                          class="rounded-0 flex-grow-1 mb-0"
                        />
                        <argon-button
                          type="button"
                          variant="outline"
                          color="success"
                          size="sm"
                          class="rounded-0 text-nowrap px-3"
                          style="height: 46px"
                          @click="sendVerificationCode"
                        >
                          인증번호 발송
                        </argon-button>
                      </div>
                    </div>

                    <!-- 인증번호 입력 + 확인 버튼 -->
                    <div class="mb-3">
                      <label class="form-label text-sm">인증번호 입력</label>
                      <div class="d-flex gap-2">
                        <argon-input
                          id="authCode"
                          type="text"
                          placeholder="인증번호 6자리"
                          name="authCode"
                          size="lg"
                          class="rounded-0 flex-grow-1 mb-0"
                        />
                        <argon-button
                          type="button"
                          variant="outline"
                          color="dark"
                          size="sm"
                          class="rounded-0 text-nowrap px-3"
                          style="height: 46px"
                          @click="confirmVerificationCode"
                        >
                          확인
                        </argon-button>
                      </div>
                    </div>

                    <div class="text-center mt-4">
                      <argon-button
                        fullWidth
                        variant="gradient"
                        color="success"
                        class="rounded-0 py-2 mb-3"
                        size="lg"
                      >
                        아이디 확인
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
                        로그인 화면으로
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

<style scoped>
/* 커스텀 스타일이 필요할 경우 여기에 작성 */
</style>
