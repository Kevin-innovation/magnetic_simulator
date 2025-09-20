/**
 * Three.js 씬 관리 클래스
 * 3D 씬 초기화, 카메라, 조명, 렌더링 등을 담당
 */

class MagneticScene {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        // 성능 모니터링
        this.fpsCounter = Utils.createFPSCounter();
        this.lastFrameTime = 0;

        // 환경 설정
        this.ambientLight = null;
        this.directionalLight = null;
        this.floor = null;

        // 이벤트 바인딩
        this.onWindowResize = this.onWindowResize.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseClick = this.onMouseClick.bind(this);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // 마우스 상태 추적 (연속 클릭용)
        this.isMouseDown = false;
        this.lastParticleSpawn = 0;
        this.particleSpawnInterval = 100; // 100ms마다 생성

        this.init();
    }

    /**
     * 씬 초기화
     */
    init() {
        Utils.debug('Initializing 3D scene...');

        // WebGL 지원 확인
        if (!Utils.isWebGLSupported()) {
            Utils.error('WebGL is not supported in this browser');
            this.showWebGLError();
            return;
        }

        this.createRenderer();
        this.createScene();
        this.createCamera();
        this.createLights();
        this.createFloor();
        this.createControls();
        this.addEventListeners();

        Utils.debug('Scene initialized successfully');
    }

    /**
     * 렌더러 생성
     */
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Utils.getPixelRatio());
        this.renderer.setClearColor(0x87CEEB, 1); // 하늘색 배경

        // 그림자 활성화
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 톤 매핑 설정
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        Utils.debug('Renderer created');
    }

    /**
     * 씬 생성
     */
    createScene() {
        this.scene = new THREE.Scene();

        // 안개 효과 (원거리 객체 페이드아웃)
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

        Utils.debug('Scene created');
    }

    /**
     * 카메라 생성
     */
    createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

        // 카메라 초기 위치
        this.camera.position.set(5, 8, 10);
        this.camera.lookAt(0, 0, 0);

        Utils.debug('Camera created');
    }

    /**
     * 조명 생성
     */
    createLights() {
        // 환경광 (전체적인 밝기)
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.ambientLight);

        // 방향광 (그림자 생성)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(10, 10, 5);
        this.directionalLight.castShadow = true;

        // 그림자 설정
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.directionalLight.shadow.camera.left = -10;
        this.directionalLight.shadow.camera.right = 10;
        this.directionalLight.shadow.camera.top = 10;
        this.directionalLight.shadow.camera.bottom = -10;

        this.scene.add(this.directionalLight);

        // 추가 조명 (보조광)
        const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);

        Utils.debug('Lights created');
    }

    /**
     * 바닥 생성
     */
    createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });

        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2; // 바닥이 수평이 되도록 회전
        this.floor.position.y = 0;
        this.floor.receiveShadow = true;

        this.scene.add(this.floor);

        // 바닥 격자 추가
        const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);

        Utils.debug('Floor created');
    }

    /**
     * 컨트롤러 생성 (OrbitControls)
     */
    createControls() {
        // OrbitControls가 로드되었는지 확인
        if (typeof THREE.OrbitControls === 'undefined') {
            Utils.warn('OrbitControls not available, skipping controls setup');
            return;
        }

        try {
            this.controls = new THREE.OrbitControls(this.camera, this.canvas);

            // 컨트롤 설정
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.1;
            this.controls.screenSpacePanning = false;

            // 줌 제한 (휠 스크롤 확대/축소)
            this.controls.enableZoom = true;
            this.controls.minDistance = 3;
            this.controls.maxDistance = 25;
            this.controls.zoomSpeed = 2.0; // 휠 속도 증가

            // 회전 제한
            this.controls.enableRotate = true;
            this.controls.rotateSpeed = 1.0;
            this.controls.maxPolarAngle = Math.PI / 2.1; // 바닥 아래로 못 가게

            // 패닝 설정
            this.controls.enablePan = true;
            this.controls.panSpeed = 1.0;

            // 타겟 설정
            this.controls.target.set(0, 0, 0);

            // 휠 이벤트 테스트
            console.log('OrbitControls zoom enabled:', this.controls.enableZoom);
            console.log('OrbitControls object:', this.controls);

            Utils.debug('Controls created with zoom enabled');
        } catch (error) {
            Utils.error('Failed to create OrbitControls', error);
        }
    }

    /**
     * 이벤트 리스너 추가
     */
    addEventListeners() {
        window.addEventListener('resize', this.onWindowResize, false);
        this.canvas.addEventListener('mousemove', this.onMouseMove, false);
        this.canvas.addEventListener('click', this.onMouseClick, false);

        // 마우스 다운/업 이벤트 추가 (연속 생성용)
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // 좌클릭만
                this.isMouseDown = true;
                this.onMouseClick(e); // 즉시 한 번 생성
            }
        }, false);

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isMouseDown = false;
            }
        }, false);

        // 마우스가 캔버스 밖으로 나가면 중지
        this.canvas.addEventListener('mouseleave', () => {
            this.isMouseDown = false;
        }, false);

        // 휠 이벤트 명시적 처리 (OrbitControls 휠이 안 될 때 대비)
        this.canvas.addEventListener('wheel', (e) => {
            if (this.controls && this.controls.enabled) {
                // OrbitControls가 휠 이벤트를 처리하도록 허용
                return;
            }

            // OrbitControls가 없으면 수동으로 줌 처리
            e.preventDefault();
            const delta = e.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(delta);

            // 거리 제한
            const distance = this.camera.position.length();
            if (distance < 3) {
                this.camera.position.normalize().multiplyScalar(3);
            } else if (distance > 25) {
                this.camera.position.normalize().multiplyScalar(25);
            }
        }, { passive: false });

        Utils.debug('Event listeners added');
    }

    /**
     * 윈도우 리사이즈 처리
     */
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);

        Utils.debug(`Window resized to ${width}x${height}`);
    }

    /**
     * 마우스 이동 처리
     * @param {Event} event 마우스 이벤트
     */
    onMouseMove(event) {
        // 정규화된 마우스 좌표 계산
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    /**
     * 마우스 클릭 처리 (철가루 생성용)
     * @param {Event} event 마우스 이벤트
     */
    onMouseClick(event) {
        // 클릭 위치에서 바닥으로의 레이캐스팅
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObject(this.floor);

        if (intersects.length > 0) {
            const clickPoint = intersects[0].point;

            // 사용자 정의 이벤트 발생 (main.js에서 처리)
            const customEvent = new CustomEvent('ironParticleSpawn', {
                detail: {
                    position: clickPoint,
                    count: Utils.randomInt(3, 8) // 한 번에 3-8개 생성
                }
            });

            document.dispatchEvent(customEvent);
        }
    }

    /**
     * 현재 마우스 위치에서 철가루 생성
     */
    spawnParticlesAtMousePosition() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.floor);

        if (intersects.length > 0) {
            const clickPoint = intersects[0].point;

            // 사용자 정의 이벤트 발생
            const customEvent = new CustomEvent('ironParticleSpawn', {
                detail: {
                    position: clickPoint,
                    count: Utils.randomInt(2, 4) // 연속 생성시 적은 개수
                }
            });

            document.dispatchEvent(customEvent);
        }
    }

    /**
     * 마우스 위치에서 월드 좌표 계산
     * @param {number} x 마우스 X 좌표
     * @param {number} y 마우스 Y 좌표
     * @param {number} height 높이 (기본값: 0)
     * @returns {THREE.Vector3} 월드 좌표
     */
    getWorldPosition(x, y, height = 0) {
        const vector = new THREE.Vector3(x, y, 0.5);
        vector.unproject(this.camera);

        const dir = vector.sub(this.camera.position).normalize();
        const distance = (height - this.camera.position.y) / dir.y;

        return this.camera.position.clone().add(dir.multiplyScalar(distance));
    }

    /**
     * 렌더링 루프
     */
    render() {
        const deltaTime = this.clock.getDelta();
        const fps = this.fpsCounter.update();
        const currentTime = performance.now();

        // 마우스 꾹 누르고 있을 때 연속 철가루 생성
        if (this.isMouseDown && currentTime - this.lastParticleSpawn > this.particleSpawnInterval) {
            this.spawnParticlesAtMousePosition();
            this.lastParticleSpawn = currentTime;
        }

        // 컨트롤 업데이트
        if (this.controls) {
            this.controls.update();
        }

        // 실제 렌더링
        this.renderer.render(this.scene, this.camera);

        // 성능 모니터링 (디버그 모드)
        if (window.DEBUG_MODE && fps !== this.lastFrameTime) {
            if (fps < 30) {
                Utils.warn(`Low FPS detected: ${fps}`);
            }
            this.lastFrameTime = fps;
        }
    }

    /**
     * 씬에 객체 추가
     * @param {THREE.Object3D} object 추가할 객체
     */
    add(object) {
        this.scene.add(object);
    }

    /**
     * 씬에서 객체 제거
     * @param {THREE.Object3D} object 제거할 객체
     */
    remove(object) {
        this.scene.remove(object);
    }

    /**
     * 모든 객체 제거 (리셋용)
     * @param {string} type 제거할 객체 타입 ('particles', 'magnets', 'all')
     */
    clearObjects(type = 'all') {
        const objectsToRemove = [];

        this.scene.traverse((child) => {
            if (type === 'all' ||
                (type === 'particles' && child.userData.type === 'ironParticle') ||
                (type === 'magnets' && child.userData.type === 'magnet')) {
                objectsToRemove.push(child);
            }
        });

        objectsToRemove.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });

        Utils.debug(`Cleared ${objectsToRemove.length} objects of type: ${type}`);
    }

    /**
     * WebGL 오류 표시
     */
    showWebGLError() {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            text-align: center;
            z-index: 1000;
        `;
        errorDiv.innerHTML = `
            <h3>WebGL을 지원하지 않는 브라우저입니다</h3>
            <p>이 시뮬레이션을 실행하려면 WebGL을 지원하는 최신 브라우저가 필요합니다.</p>
            <p>Chrome, Firefox, Safari, Edge 브라우저를 사용해주세요.</p>
        `;
        document.body.appendChild(errorDiv);
    }

    /**
     * 리소스 정리
     */
    dispose() {
        window.removeEventListener('resize', this.onWindowResize);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('click', this.onMouseClick);

        if (this.controls) {
            this.controls.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        Utils.debug('Scene disposed');
    }
}