# midproject

1차 프로젝트
main branch는 최종 배포를 위한 branch
develop branch는 개인별 작업물을 통합하는 branch
feature/(1,2,3,4) (명칭 변경 가능)은 각각 개인이 작업하는 branch
feature/1, feature/2 ....의 branch에 자유롭게 개인이 작업물을 push를 하고 develop으로 합치는 과정이 필요함
쉽게 관리를 하기 위해서는 git pull을 할때는 develop branch(모두의 작업물이 합쳐진 것)을 가져와서 작업을 하고 개인 branch에 push한 뒤에 git 관리자에게 pull request(develop branch에 합쳐달라는 요청)을 하는 순서
git 관리자는 요청이 들어온 것을 합치는 과정 진행


# 2️⃣ Git 운영 규칙 문서 (팀 공지용)

## 📌 Git 운영 정책

### 1. main 브랜치
- 직접 push 금지
- PR로만 merge 가능
- 항상 배포 가능 상태 유지

### 2. develop 브랜치
- 직접 push 금지
- feature 브랜치 → PR → merge
- ## 📌 절대 금지
git push origin main
git merge develop (로컬에서 강제 병합 후 push)

### 3. 개인 브랜치 규칙
형식: feature/이름_기능
예:

feature/seongsu_login

feature/jinhwan_dbconnect


### ✔ 작업 시작 전
```bash
git checkout develop
git pull origin develop
git checkout -b feature/이름_기능

✔ 작업 후
git add .
git commit -m "feat: 로그인 기능 구현"
git push -u origin feature/이름_기능

✔ Pull Request

base: develop

PR 제목: [feat] 로그인 기능

설명: 구현 내용, 테스트 방법 작성

* 커밋 메시지 규칙
-feat :	기능 추가
-fix	 : 버그 수정
-refactor	: 코드 개선
-style	 : UI 변경
-docs :	문서 수정

4️⃣ Git 담당자 운영 체크리스트 (육성수)
🔹 매일 확인

 PR 대기 목록 확인

 develop 실행 테스트

 충돌 여부 확인

 router.js 충돌 점검

🔹 Merge 전 체크

PR 설명 확인

코드 diff 확인

npm run dev 실행 테스트

콘솔 에러 체크

DB 변경 여부 확인

🔹 충돌 발생 시
git checkout develop
git pull origin develop
git checkout feature/브랜치명
git merge develop

충돌 해결 → commit → push

<img width="1150" height="1524" alt="git-model@2x" src="https://github.com/user-attachments/assets/f899e618-8bcd-4353-8bd1-f3c1ae44672e" />
