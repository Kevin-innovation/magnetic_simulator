# 자석 철가루 시뮬레이션 (Magnetic Field Simulator)

물리학 교육용 3D 자석-철가루 상호작용 시뮬레이션 웹 애플리케이션

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Three.js](https://img.shields.io/badge/Three.js-r140-orange.svg)
![Status](https://img.shields.io/badge/status-MVP%20Phase%201-green.svg)

## 📋 프로젝트 개요

### 🎯 목표
- 직관적인 3D 환경에서 자기장과 철가루의 상호작용을 시각화
- 물리학 교육을 위한 인터랙티브 시뮬레이션 제공
- 웹 브라우저에서 실행되는 경량 애플리케이션

### ✨ 주요 기능
- 🖱️ **마우스 클릭으로 철가루 뿌리기** (클릭 유지 시 연속 생성)
- 🧲 **자석 드래그 앤 드롭** (막대자석, 고리자석)
- ⚡ **실시간 자기장 시뮬레이션** (물리 법칙 적용)
- 🔄 **3D 환경 조작** (회전, 확대/축소, 패닝)
- ⚙️ **자석 세기 조절** (슬라이더 컨트롤)
- 🔧 **리셋 및 정리 기능**

## 🚀 빠른 시작

### 📋 요구사항
- Node.js (v14 이상)
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- WebGL 지원

### 🛠️ 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/Kevin-innovation/magnetic_simulator.git
cd magnetic_simulator

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:8080` 접속

### 📦 배포

```bash
# 프로덕션 배포 (Vercel)
npm run deploy
```

## 🎮 사용 방법

### 🖱️ 마우스 조작
- **좌클릭**: 철가루 뿌리기
- **좌클릭 유지**: 철가루 연속 생성
- **드래그**: 자석 이동
- **우클릭 드래그**: 시점 회전
- **휠 스크롤**: 확대/축소

### ⌨️ 키보드 단축키
- **스페이스바**: 철가루 제거
- **Ctrl+R**: 전체 리셋
- **↑/↓**: 자석 세기 조절
- **1-4**: 자석 세기 프리셋
- **H**: 도움말 표시
- **Ctrl+D**: 디버그 모드

### 📱 모바일 지원
- **더블 탭**: 리셋
- **핀치**: 자석 세기 조절

## 🏗️ 기술 스택

### Frontend
- **HTML5/CSS3/JavaScript (ES6+)**
- **Three.js r140** - 3D 렌더링 및 물리 시뮬레이션
- **Vanilla JavaScript** - 프레임워크 없는 경량 구현

### 개발 도구
- **live-server** - 로컬 개발 서버
- **Git** - 버전 관리

### 배포
- **Vercel** - 정적 사이트 호스팅
- **GitHub** - 소스 코드 관리

## 📁 프로젝트 구조

```
magnetic-simulation-mvp/
├── index.html                 # 메인 HTML 파일
├── src/
│   ├── styles/
│   │   └── main.css          # 스타일시트
│   └── scripts/
│       ├── core/
│       │   ├── Scene.js      # Three.js 씬 관리
│       │   ├── Physics.js    # 물리 엔진
│       │   └── Utils.js      # 유틸리티 함수
│       ├── entities/
│       │   ├── Magnet.js     # 자석 클래스
│       │   └── IronParticle.js # 철가루 입자 클래스
│       ├── ui/
│       │   └── Controls.js   # UI 컨트롤러
│       └── main.js           # 메인 애플리케이션
├── assets/                   # 정적 자산
├── docs/                     # 문서
├── package.json             # 의존성 관리
├── vercel.json              # Vercel 배포 설정
└── README.md               # 프로젝트 문서
```

## 🧪 물리 시뮬레이션

### 🔬 구현된 물리 법칙
- **자기력**: 역제곱 법칙 기반 자기장 계산
- **중력**: 철가루에 중력 효과 적용
- **공기저항**: 현실적인 입자 운동
- **충돌**: 바닥 및 입자 간 충돌 처리
- **감쇠**: 에너지 손실 시뮬레이션

### 🧲 자석 종류
1. **막대자석** (Bar Magnet)
   - N극(빨강), S극(파랑) 구분
   - 선형 자기장 패턴

2. **고리자석** (Ring Magnet)
   - 원형 자기장 분포
   - 중심축 기반 자기장

### ⚙️ 성능 최적화
- **객체 풀링**: 입자 재사용으로 메모리 효율성
- **LOD**: 거리 기반 디테일 조절
- **최대 입자 수 제한**: 1000개 (성능 유지)
- **프레임레이트 제한**: 60fps 타겟

## 🎯 개발 진행상황

### ✅ Phase 1: 기본 환경 구축 (v0.1.0) - 완료
- [x] 프로젝트 구조 설정
- [x] Three.js 기본 씬 구성
- [x] Git 저장소 설정
- [x] 로컬 개발 환경 구축
- [x] OrbitControls 휠 스크롤 지원
- [x] 마우스 클릭 유지 시 연속 철가루 생성
- [x] 자석 2종류 구현 (막대자석, 고리자석)

### 🚧 Phase 2: 자석 시스템 (v0.2.0) - 진행중
- [ ] 자석 물리 속성 세밀 조정
- [ ] 자기력선 시각화
- [ ] 자석 간 상호작용

### 📋 Phase 3: 철가루 파티클 시스템 (v0.3.0) - 예정
- [ ] 파티클 성능 최적화
- [ ] 입자 간 자기 유도 효과
- [ ] 시각적 효과 개선

### 📋 Phase 4: UI 및 상호작용 (v0.4.0) - 예정
- [ ] 고급 컨트롤 패널
- [ ] 시나리오 프리셋
- [ ] 반응형 디자인 완성

### 📋 Phase 5: 최적화 및 배포 (v1.0.0) - 예정
- [ ] 성능 최적화
- [ ] 모바일 최적화
- [ ] PWA 기능 추가

## 🌐 브라우저 호환성

| 브라우저 | 버전 | 상태 |
|---------|------|------|
| Chrome | 90+ | ✅ 완전 지원 |
| Firefox | 88+ | ✅ 완전 지원 |
| Safari | 14+ | ✅ 완전 지원 |
| Edge | 90+ | ✅ 완전 지원 |

## 📈 성능 목표

- **프레임레이트**: 60fps 유지
- **입자 수**: 최대 1000개
- **로딩 시간**: 3초 이내
- **번들 크기**: 500KB 이하

## 🤝 기여하기

1. 이 저장소를 Fork합니다
2. 새 브랜치를 만듭니다 (`git checkout -b feature/새기능`)
3. 변경사항을 커밋합니다 (`git commit -am 'feat: 새기능 추가'`)
4. 브랜치에 Push합니다 (`git push origin feature/새기능`)
5. Pull Request를 생성합니다

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 설정 등
```

## 🐛 이슈 신고

GitHub Issues를 통해 버그 신고나 기능 요청을 해주세요:
- 🐛 `bug`: 버그 수정
- ✨ `enhancement`: 기능 개선
- 📚 `documentation`: 문서 관련
- ⚡ `performance`: 성능 최적화
- 🎨 `ui/ux`: 사용자 인터페이스

## 📚 참고 자료

- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Physics Simulation](https://www.khanacademy.org/science/physics)
- [Magnetic Fields](https://en.wikipedia.org/wiki/Magnetic_field)

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👨‍💻 작성자

**Kevin Innovation**
- GitHub: [@Kevin-innovation](https://github.com/Kevin-innovation)
- 프로젝트 링크: [magnetic_simulator](https://github.com/Kevin-innovation/magnetic_simulator)

---

**프로젝트 시작일**: 2025년 9월 20일
**현재 버전**: v0.1.0
**다음 마일스톤**: v0.2.0 (자석 시스템 완성)

### 🎉 최신 업데이트 (v0.1.0)
- ✅ Three.js r140 기반 3D 씬 구축
- ✅ OrbitControls 휠 스크롤 확대/축소 지원
- ✅ 마우스 클릭 유지 시 철가루 연속 생성
- ✅ 2종류 자석 (막대자석, 고리자석) 드래그 앤 드롭
- ✅ 실시간 물리 시뮬레이션 (중력, 자기력, 충돌)
- ✅ 반응형 UI 및 키보드 단축키
- ✅ 디버그 모드 및 성능 모니터링