# midproject
1차 프로젝트
main branch는 최종 배포를 위한 branch
develop branch는 개인별 작업물을 통합하는 branch
feature/(1,2,3,4) (명칭 변경 가능)은 각각 개인이 작업하는 branch
feature/1, feature/2 ....의 branch에 자유롭게 개인이 작업물을 push를 하고 develop으로 합치는 과정이 필요함
쉽게 관리를 하기 위해서는 git pull을 할때는 develop branch(모두의 작업물이 합쳐진 것)을 가져와서 작업을 하고 개인 branch에 push한 뒤에 git 관리자에게 pull request(develop branch에 합쳐달라는 요청)을 하는 순서
git 관리자는 요청이 들어온 것을 합치는 과정 진행
