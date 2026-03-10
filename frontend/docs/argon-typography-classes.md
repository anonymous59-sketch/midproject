# Argon Dashboard CSS — 글자(타이포그래피) 클래스 정리

현재 프로젝트에 적용 중인 Argon Dashboard 스타일에서 사용 가능한 **글자 모양(타이포그래피)** 관련 클래스를 용도별로 정리한 문서입니다.

---

## 1. 제목 (Headings)

| 클래스 | 설명 | 비고 |
|--------|------|------|
| `h1`, `.h1` | 가장 큰 제목 | RFS로 작은 화면에서 유동 크기 |
| `h2`, `.h2` | 2단계 제목 | |
| `h3`, `.h3` | 3단계 제목 | |
| `h4`, `.h4` | 4단계 제목 | |
| `h5`, `.h5` | 5단계 제목 | |
| `h6`, `.h6` | 6단계 제목 | |

- h1~h3: `font-weight: bolder`, h4~h6: `font-weight: bold`
- h1~h4: `letter-spacing: tighter` 적용

---

## 2. 본문·리드 문단

| 클래스 | 설명 |
|--------|------|
| `p`, `.p` | 기본 문단 (1rem, line-height 1.625) |
| `.lead` | 강조 문단 (1.25rem, font-weight 300) |

---

## 3. 디스플레이 제목 (Display)

| 클래스 | 설명 |
|--------|------|
| `.display-1` | 매우 큰 디스플레이용 제목 |
| `.display-2` | |
| `.display-3` | |
| `.display-4` | |
| `.display-5` | |
| `.display-6` | 가장 작은 디스플레이 제목 |

- font-weight: 300, 큰 크기용

---

## 4. 글자 크기 (Font size)

### 4-1. Argon 전용 크기 클래스

| 클래스 | 설명 |
|--------|------|
| `.text-lg` | 큰 글자 (font-size-lg) |
| `.text-sm` | 작은 글자 (font-size-sm) + line-height 보정 |
| `.text-xs` | 더 작은 글자 (font-size-xs) + line-height 보정 |
| `.text-xxs` | 가장 작은 글자 (font-size-xxs) |
| `.text-2xl` | 1.5rem |
| `.text-3xl` | 1.875rem |
| `.text-4xl` | 2rem |
| `.text-5xl` | 2.25rem |
| `.text-6xl` | 3rem |
| `.text-7xl` | 3.75rem |
| `.text-8xl` | 4rem |
| `.text-9xl` | 5rem |

### 4-2. Bootstrap 유틸리티 (fs-)

| 클래스 | 설명 |
|--------|------|
| `.fs-1` | h1 크기 |
| `.fs-2` | h2 크기 |
| `.fs-3` | h3 크기 |
| `.fs-4` | h4 크기 |
| `.fs-5` | h5 크기 |
| `.fs-6` | h6 크기 |

- RFS 적용으로 뷰포트에 따라 크기 조절 가능

---

## 5. 글자 굵기 (Font weight)

### 5-1. Argon 전용 (클래스명으로 의미 전달)

| 클래스 | 설명 |
|--------|------|
| `.text-lighter` | 더 가벼움 |
| `.text-light` | 300 |
| `.text-normal` | 400 |
| `.text-bold` | 600 (Argon 변수 기준) |
| `.text-bolder` | 700 |

### 5-2. Bootstrap 유틸리티 (fw-)

| 클래스 | 설명 |
|--------|------|
| `.font-weight-light`, `.fw-light` | 300 |
| `.font-weight-lighter`, `.fw-lighter` | lighter |
| `.font-weight-normal`, `.fw-normal` | 400 |
| `.font-weight-bold`, `.fw-bold` | 700 |
| `.font-weight-bolder`, `.fw-bolder` | bolder |

---

## 6. 글자 스타일 (Font style)

| 클래스 | 설명 |
|--------|------|
| `.font-italic` | 이탤릭 |
| `.fst-italic` | 이탤릭 (Bootstrap 유틸리티) |
| `.fst-normal` | 일반 스타일 |

---

## 7. 글꼴 패밀리 (Font family)

| 클래스 | 설명 |
|--------|------|
| `.text-sans-serif` | sans-serif 계열 (Argon 기본) |
| `.text-monospace` | 고정폭(monospace) |
| `.font-monospace` | Bootstrap: monospace |

---

## 8. 정렬 (Text align)

| 클래스 | 설명 | 반응형 |
|--------|------|--------|
| `.text-start` | 왼쪽 정렬 | ○ (sm, md, lg, xl, xxl) |
| `.text-end` | 오른쪽 정렬 | ○ |
| `.text-center` | 가운데 정렬 | ○ |
| `.text-justify` | 양쪽 정렬 | — |

- 예: `.text-md-center` → md 이상에서 가운데 정렬

---

## 9. 줄/공백 처리 (White space, wrap, break)

| 클래스 | 설명 |
|--------|------|
| `.text-wrap` | 줄바꿈 허용 (white-space: normal) |
| `.text-nowrap` | 줄바꿈 안 함 (white-space: nowrap) |
| `.text-truncate` | 한 줄 말줄임 (overflow hidden + text-overflow ellipsis) |
| `.text-break` | 단어 중간에서 줄바꿈 (word-break: break-word) |

---

## 10. 대소문자·장식 (Transform, Decoration)

| 클래스 | 설명 |
|--------|------|
| `.text-lowercase` | 소문자 |
| `.text-uppercase` | 대문자 |
| `.text-capitalize` | 단어 첫 글자만 대문자 |
| `.text-decoration-none` | 밑줄/취소선 제거 |
| `.text-decoration-underline` | 밑줄 |
| `.text-decoration-line-through` | 취소선 |

---

## 11. 글자 간격 (Letter spacing)

| 클래스 | 설명 |
|--------|------|
| `.letter-wider` | 넓은 간격 |
| `.letter-normal` | 기본 간격 |
| `.letter-tighter` | 좁은 간격 |

---

## 12. 줄 높이 (Line height)

| 클래스 | 설명 |
|--------|------|
| `.lh-1` | 1 |
| `.lh-sm` | 작은 줄간격 |
| `.lh-base` | 기본 줄간격 |
| `.lh-lg` | 큰 줄간격 |

---

## 13. 글자 색 (Text color)

| 클래스 | 설명 |
|--------|------|
| `.text-primary` | Primary 색 |
| `.text-secondary` | Secondary 색 |
| `.text-success` | Success 색 |
| `.text-info` | Info 색 |
| `.text-warning` | Warning 색 |
| `.text-danger` | Danger 색 |
| `.text-dark` | 진한 색 |
| `.text-body` | 본문 색 |
| `.text-muted` | 흐린 회색 (보조 문구용) |
| `.text-black-50` | 검정 50% 투명 |
| `.text-white-50` | 흰색 50% 투명 |
| `.text-reset` | 상속 (inherit) |

---

## 14. 그라데이션 글자 (Argon 전용)

| 클래스 | 설명 |
|--------|------|
| `.text-gradient.text-primary` | Primary 그라데이션 글자 |
| `.text-gradient.text-info` | Info 그라데이션 |
| `.text-gradient.text-success` | Success 그라데이션 |
| `.text-gradient.text-warning` | Warning 그라데이션 |
| `.text-gradient.text-danger` | Danger 그라데이션 |
| `.text-gradient.text-dark` | Dark 그라데이션 |

- `background-clip: text` + `-webkit-text-fill-color: transparent` 로 구현

---

## 15. 기타 (인용, 리스트, 강조)

| 클래스 | 설명 |
|--------|------|
| `.blockquote` | 인용문 스타일 (왼쪽 테두리 + 이탤릭) |
| `.blockquote-footer` | 인용 출처 |
| `.small`, `.mark` | 작은 글자 / 하이라이트 (Bootstrap) |
| `.initialism` | 약어용 작은 대문자 |
| `.list-unstyled` | 리스트 불릿 제거 |
| `.list-inline` | 리스트를 한 줄로 |

---

## 사용 예시

```html
<!-- 제목 -->
<h1 class="text-dark">페이지 제목</h1>
<h5 class="text-muted">부제목</h5>

<!-- 본문 강조 -->
<p class="lead text-muted">리드 문단</p>
<p class="text-sm">보조 설명</p>

<!-- 굵기 + 크기 -->
<span class="fw-bold text-uppercase text-xs">라벨</span>

<!-- 그라데이션 제목 -->
<h3 class="text-gradient text-primary">그라데이션 제목</h3>

<!-- 정렬 + 말줄임 -->
<p class="text-center text-truncate">가운데 정렬 말줄임</p>
```

---

*기준: `frontend/src/assets/scss/argon-dashboard` (Bootstrap + Argon theme + custom)*
