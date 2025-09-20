# 자석 철가루 시뮬레이션 MVP 개발 계획서

## 📋 프로젝트 개요

### 목표
물리학 교육용 3D 자석-철가루 상호작용 시뮬레이션 웹 애플리케이션 개발

### 핵심 기능
- 마우스 클릭으로 철가루 뿌리기
- 자석 드래그 앤 드롭
- 실시간 자기장 시뮬레이션
- 3D 환경에서의 물리 법칙 적용

## 🏗️ 기술 스택

### Frontend
- **HTML5/CSS3/JavaScript (ES6+)**
- **Three.js r128** (안정 버전 - 충돌 방지)
- **Vanilla JavaScript** (프레임워크 없이 경량화)

### 배포
- **Vercel** (정적 호스팅)
- **Git/GitHub** (버전 관리)

### 개발 도구
- **VSCode**
- **Live Server** (로컬 개발)
- **Git** (버전 관리)

## 📁 프로젝트 구조

```
magnetic-simulation-mvp/
├── index.html                 # 메인 HTML 파일
├── src/
│   ├── styles/
│   │   └── main.css          # 스타일시트
│   ├── scripts/
│   │   ├── core/
│   │   │   ├── Scene.js      # Three.js 씬 초기화
│   │   │   ├── Physics.js    # 물리 엔진
│   │   │   └── Utils.js      # 유틸리티 함수
│   │   ├── entities/
│   │   │   ├── Magnet.js     # 자석 클래스
│   │   │   └── IronParticle.js # 철가루 입자 클래스
│   │   ├── ui/
│   │   │   └── Controls.js   # UI 컨트롤러
│   │   └── main.js           # 메인 애플리케이션
├── assets/
│   └── models/               # 3D 모델 (필요시)
├── docs/
│   ├── README.md            # 프로젝트 문서
│   └── CHANGELOG.md         # 버전 변경 내역
├── .gitignore
├── package.json             # 의존성 관리 (개발 도구용)
└── vercel.json              # Vercel 배포 설정
```

## 🔧 개발 환경 설정

### 1. 저장소 초기화
```bash
mkdir magnetic-simulation-mvp
cd magnetic-simulation-mvp
git init
npm init -y
```

### 2. Three.js 안정 버전 설정
```html
<!-- index.html에서 CDN 사용 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/controls/OrbitControls.js"></script>
```

### 3. .gitignore 설정
```
node_modules/
.DS_Store
*.log
dist/
.env
.vercel
```

### 4. 개발 서버 설정
```json
// package.json
{
  "scripts": {
    "dev": "npx live-server --port=3000",
    "build": "echo 'Static files ready for deployment'",
    "deploy": "vercel --prod"
  },
  "devDependencies": {
    "live-server": "^1.2.2"
  }
}
```

## 📝 개발 단계별 계획

### Phase 1: 기본 환경 구축 (v0.1.0)
**예상 소요시간: 1일**

#### 작업 내용
- [ ] 프로젝트 구조 설정
- [ ] Three.js 기본 씬 구성
- [ ] Git 저장소 설정
- [ ] 로컬 개발 환경 구축

#### 결과물
- 기본 3D 씬 (카메라, 조명, 바닥)
- OrbitControls로 시점 조작 가능
- 로컬 서버 실행 확인

#### Git 커밋 메시지 컨벤션
```
feat: 기본 Three.js 씬 구성
docs: README.md 초기 작성
setup: 프로젝트 구조 및 개발 환경 설정
```

### Phase 2: 자석 시스템 (v0.2.0)
**예상 소요시간: 2일**

#### 작업 내용
- [ ] Magnet 클래스 구현
- [ ] 막대자석, 고리자석 3D 모델링
- [ ] 자기장 계산 로직
- [ ] 자석 드래그 앤 드롭 기능

#### 브랜치 전략
```bash
git checkout -b feature/magnet-system
# 개발 완료 후
git checkout main
git merge feature/magnet-system
git tag v0.2.0
```

### Phase 3: 철가루 파티클 시스템 (v0.3.0)
**예상 소요시간: 2일**

#### 작업 내용
- [ ] IronParticle 클래스 구현
- [ ] 파티클 풀링 시스템
- [ ] 마우스 이벤트로 철가루 생성
- [ ] 물리 법칙 적용 (중력, 자기력)

### Phase 4: UI 및 상호작용 (v0.4.0)
**예상 소요시간: 1일**

#### 작업 내용
- [ ] 컨트롤 패널 UI
- [ ] 자석 세기 조절 슬라이더
- [ ] 리셋 기능
- [ ] 반응형 디자인

### Phase 5: 최적화 및 배포 (v1.0.0)
**예상 소요시간: 1일**

#### 작업 내용
- [ ] 성능 최적화
- [ ] 버그 수정
- [ ] Vercel 배포 설정
- [ ] 문서 정리

## 🚀 배포 설정

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### 배포 명령어
```bash
# Vercel CLI 설치
npm i -g vercel

# 첫 배포
vercel

# 프로덕션 배포
vercel --prod
```

## 📊 버전 관리 전략

### Git Flow
```
main (프로덕션)
├── develop (개발)
├── feature/magnet-system
├── feature/particle-system
├── feature/ui-controls
└── hotfix/버그수정
```

### 태그 규칙
- `v0.1.0`: 기본 환경
- `v0.2.0`: 자석 시스템
- `v0.3.0`: 파티클 시스템
- `v0.4.0`: UI 완성
- `v1.0.0`: MVP 완성

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

## 🧪 테스트 전략

### 수동 테스트 체크리스트
- [ ] 철가루 생성 (마우스 클릭)
- [ ] 자석 드래그 앤 드롭
- [ ] 자기장 영향 확인
- [ ] UI 반응성 테스트
- [ ] 모바일 브라우저 호환성
- [ ] 성능 테스트 (1000개 입자)

### 브라우저 호환성
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

## 📈 성능 목표

### 기술적 요구사항
- **프레임레이트**: 60fps 유지
- **입자 수**: 최대 1000개
- **로딩 시간**: 3초 이내
- **번들 크기**: 500KB 이하

### 최적화 전략
- 파티클 풀링으로 메모리 효율성
- LOD(Level of Detail) 적용
- 불필요한 계산 최소화
- GPU 가속 활용

## 📚 참고 자료

### Three.js 문서
- [Three.js r128 Documentation](https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene)
- [OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)
- [ParticleSystem](https://threejs.org/docs/#api/en/objects/Points)

### 물리학 참고
- 자기장 계산 공식
- 쿨롱의 법칙
- 입자 운동 방정식

## 🔄 업데이트 계획

### v1.1.0 (MVP 이후)
- 자기력선 시각화
- 다양한 자석 모양 추가
- 실험 시나리오 프리셋

### v1.2.0
- 저장/불러오기 기능
- 애니메이션 녹화
- 측정 도구 추가

## 📞 이슈 트래킹

### GitHub Issues 라벨
- `bug`: 버그 수정
- `enhancement`: 기능 개선
- `documentation`: 문서 관련
- `performance`: 성능 최적화
- `ui/ux`: 사용자 인터페이스

---

**프로젝트 시작일**: 2025년 9월 20일  
**MVP 목표 완료일**: 2025년 9월 27일  
**담당자**: 개발팀