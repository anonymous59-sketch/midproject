/**
 * AlertModal용 프리셋 (타입, 제목, 메시지)
 * - context: 'plan' | 'result' | 'rank'
 */
export const alertPresets = {
  /** 승인요청 완료 (지원계획, 지원결과, 우선순위) */
  approvalRequestComplete: {
    type: "success",
    title: "승인요청 완료",
    message: {
      plan: "승인요청이 완료되었습니다.",
      result: "승인요청이 완료되었습니다.",
      rank: "승인요청이 완료되었습니다.",
    },
  },
  /** 작성 취소 완료 (지원계획, 지원결과) */
  cancelComplete: {
    type: "success",
    title: { plan: "계획취소 완료", result: "결과취소 완료" },
    message: {
      plan: "지원 계획이 취소되었습니다.",
      result: "지원 결과가 취소되었습니다.",
    },
  },
  /** 승인 완료 (지원계획, 지원결과, 우선순위) */
  approvalComplete: {
    type: "success",
    title: "승인 완료",
    message: {
      plan: "지원계획이 승인되었습니다.",
      result: "지원 결과가 승인되었습니다.",
      rank: "우선순위가 승인되었습니다.",
    },
  },
  /** 반려 완료 (지원계획, 지원결과, 우선순위) */
  rejectComplete: {
    type: "reject",
    title: "반려 완료",
    message: {
      plan: "지원 계획이 반려되었습니다.",
      result: "지원 결과가 반려되었습니다.",
      rank: "우선순위가 반려되었습니다.",
    },
  },
  /** 보완 완료 (지원계획, 지원결과) - 화면설계 보완 추가 */
  suppleComplete: {
    type: "supple",
    title: "보완 완료",
    message: {
      plan: "지원 계획이 보완되었습니다.",
      result: "지원 결과가 보완되었습니다.",
    },
  },
  /** 데이터 없음 0건 (지원계획, 지원결과) */
  noData: {
    type: "error",
    title: { plan: "지원계획 찾을 수 없음", result: "지원결과 찾을 수 없음" },
    message: {
      plan: "지원 계획이 존재하지 않습니다.",
      result: "지원 결과가 존재하지 않습니다.",
    },
  },
};

/**
 * 프리셋 키와 context로 { type, title, message } 반환
 * @param {keyof alertPresets} presetKey
 * @param {'plan'|'result'|'rank'} context
 */
export function getAlertPreset(presetKey, context) {
  const preset = alertPresets[presetKey];
  if (!preset) return { type: "success", title: "알림", message: "" };
  const title =
    typeof preset.title === "string"
      ? preset.title
      : preset.title[context] ?? "알림";
  const message =
    typeof preset.message === "string"
      ? preset.message
      : preset.message[context] ?? "";
  return { type: preset.type, title, message };
}
