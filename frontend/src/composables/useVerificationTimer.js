import { ref } from "vue";

/**
 * 이메일/인증번호용 공통 타이머 composable
 *
 * - storageKey: sessionStorage 에 저장할 키 (예: "verifi_end_signup")
 * - durationSec: 타이머 길이(초) 기본 180
 *
 * 반환:
 * - countdown: 남은 시간(초)
 * - startTimer(onExpire): 타이머 시작 + 만료 시 onExpire 호출
 * - restoreTimer(onExpire): sessionStorage 기반으로 기존 타이머 복구
 * - stopTimer(): 타이머 중지 및 정리
 */
export function useVerificationTimer(storageKey, durationSec = 180) {
  const countdown = ref(0);
  let timerInterval = null;

  const getRemainingSeconds = (endTimeMs) =>
    Math.max(0, Math.ceil((endTimeMs - Date.now()) / 1000));

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const runTimerInterval = (endTimeMs, onExpire) => {
    stopTimer();
    const tick = () => {
      const remaining = getRemainingSeconds(endTimeMs);
      countdown.value = remaining;
      if (remaining <= 0) {
        stopTimer();
        sessionStorage.removeItem(storageKey);
        if (typeof onExpire === "function") {
          onExpire();
        }
      }
    };
    tick();
    timerInterval = setInterval(tick, 1000);
  };

  const startTimer = (onExpire) => {
    const endTimeMs = Date.now() + durationSec * 1000;
    sessionStorage.setItem(storageKey, String(endTimeMs));
    countdown.value = durationSec;
    runTimerInterval(endTimeMs, onExpire);
  };

  const restoreTimer = (onExpire) => {
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;
    const endTimeMs = parseInt(saved, 10);
    if (Number.isNaN(endTimeMs)) {
      sessionStorage.removeItem(storageKey);
      countdown.value = 0;
      return;
    }
    if (endTimeMs > Date.now()) {
      runTimerInterval(endTimeMs, onExpire);
    } else {
      sessionStorage.removeItem(storageKey);
      countdown.value = 0;
    }
  };

  return {
    countdown,
    startTimer,
    restoreTimer,
    stopTimer,
  };
}

