/**
 * 메인 애플리케이션 클래스
 * 전체 시뮬레이션의 초기화, 업데이트, 렌더링을 담당
 */

class MagneticSimulationApp {
    constructor() {
        // 핵심 시스템들
        this.scene = null;
        this.physics = null;
        this.uiControls = null;

        // 게임 객체들
        this.particles = [];
        this.magnets = [];

        // 시뮬레이션 상태
        this.isRunning = false;
        this.isPaused = false;
        this.animationFrameId = null;

        // 성능 관리
        this.maxParticles = 1000;
        this.particlePool = []; // 객체 풀링
        this.lastUpdateTime = 0;

        // 드래그 앤 드롭
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.draggedMagnet = null;

        // 이벤트 바인딩
        this.onIronParticleSpawn = this.onIronParticleSpawn.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        Utils.debug('Initializing Magnetic Simulation App...');

        try {
            // 핵심 시스템 초기화
            await this.initializeSystems();

            // 초기 씬 설정
            this.setupInitialScene();

            // 이벤트 리스너 등록
            this.setupEventListeners();

            // 시뮬레이션 시작
            this.start();

            Utils.debug('Application initialized successfully');

        } catch (error) {
            Utils.error('Failed to initialize application', error);
            this.showErrorMessage('애플리케이션 초기화에 실패했습니다.');
        }
    }

    /**
     * 핵심 시스템들 초기화
     */
    async initializeSystems() {
        // Three.js 씬 초기화
        const canvas = document.getElementById('threejs-canvas');
        this.scene = new MagneticScene(canvas);

        // 물리 엔진 초기화
        this.physics = new Physics();

        // UI 컨트롤러 초기화
        this.uiControls = new UIControls(this);

        // 로딩 완료 후 로딩 화면 숨김
        setTimeout(() => {
            this.uiControls.hideLoading();
        }, 1000);
    }

    /**
     * 초기 씬 설정
     */
    setupInitialScene() {
        // 기본 막대자석 추가 (가운데)
        this.addMagnet(new THREE.Vector3(0, 0.5, 0), 'bar', { strength: 1.0 });

        // 고리자석 추가 (왼쪽)
        this.addMagnet(new THREE.Vector3(-3, 0.3, 0), 'ring', { strength: 0.8 });
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 철가루 생성 이벤트
        document.addEventListener('ironParticleSpawn', this.onIronParticleSpawn);

        // 마우스 이벤트 (자석 드래그용)
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);

        // 윈도우 이벤트
        window.addEventListener('beforeunload', () => {
            this.dispose();
        });

        // 페이지 가시성 변경 (탭 전환 등)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    /**
     * 자석 추가
     * @param {THREE.Vector3} position 위치
     * @param {string} type 자석 타입
     * @param {object} options 옵션
     */
    addMagnet(position, type = 'bar', options = {}) {
        const magnet = new Magnet(position, type, options);
        this.magnets.push(magnet);
        this.scene.add(magnet.group);

        Utils.debug(`Added ${type} magnet at position:`, position);
        return magnet;
    }

    /**
     * 철가루 입자 추가
     * @param {THREE.Vector3} position 위치
     * @param {object} options 옵션
     */
    addParticle(position, options = {}) {
        // 최대 입자 수 제한
        if (this.particles.length >= this.maxParticles) {
            // 가장 오래된 입자 제거
            this.removeOldestParticle();
        }

        // 객체 풀에서 재사용 또는 새로 생성
        let particle;
        if (this.particlePool.length > 0) {
            particle = this.particlePool.pop();
            particle.position.copy(position);
            particle.velocity.set(0, 0, 0);
            particle.isDead = false;
            particle.age = 0;
        } else {
            particle = new IronParticle(position, options);
        }

        this.particles.push(particle);
        this.scene.add(particle.mesh);

        return particle;
    }

    /**
     * 철가루 생성 이벤트 처리
     * @param {CustomEvent} event 이벤트
     */
    onIronParticleSpawn(event) {
        const { position, count } = event.detail;

        for (let i = 0; i < count; i++) {
            // 약간의 랜덤 분산 적용
            const spawnPos = position.clone().add(new THREE.Vector3(
                Utils.random(-0.1, 0.1),
                Utils.random(0, 0.2),
                Utils.random(-0.1, 0.1)
            ));

            this.addParticle(spawnPos);
        }

        Utils.debug(`Spawned ${count} iron particles at:`, position);
    }

    /**
     * 마우스 다운 이벤트 (자석 드래그 시작)
     * @param {MouseEvent} event 마우스 이벤트
     */
    onMouseDown(event) {
        // 자석 드래그 체크
        for (const magnet of this.magnets) {
            if (magnet.onMouseDown(event, this.scene.camera)) {
                this.draggedMagnet = magnet;
                break;
            }
        }
    }

    /**
     * 마우스 이동 이벤트 (자석 드래그)
     * @param {MouseEvent} event 마우스 이벤트
     */
    onMouseMove(event) {
        if (this.draggedMagnet) {
            this.draggedMagnet.onMouseMove(event, this.scene.camera, this.groundPlane);
        }
    }

    /**
     * 마우스 업 이벤트 (자석 드래그 종료)
     * @param {MouseEvent} event 마우스 이벤트
     */
    onMouseUp(event) {
        if (this.draggedMagnet) {
            this.draggedMagnet.onMouseUp(event);
            this.draggedMagnet = null;
        }
    }

    /**
     * 자석 세기 변경 처리
     * @param {number} strength 새로운 세기
     */
    onMagnetStrengthChange(strength) {
        this.magnets.forEach(magnet => {
            magnet.setStrength(strength);
        });
    }

    /**
     * 시뮬레이션 시작
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.lastUpdateTime = performance.now();

        this.animate();

        Utils.debug('Simulation started');
    }

    /**
     * 시뮬레이션 일시정지
     */
    pause() {
        this.isPaused = true;
        Utils.debug('Simulation paused');
    }

    /**
     * 시뮬레이션 재개
     */
    resume() {
        this.isPaused = false;
        this.lastUpdateTime = performance.now();
        Utils.debug('Simulation resumed');
    }

    /**
     * 시뮬레이션 정지
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        Utils.debug('Simulation stopped');
    }

    /**
     * 메인 애니메이션 루프
     */
    animate() {
        if (!this.isRunning) return;

        this.animationFrameId = requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastUpdateTime) / 1000, 1/30); // 최대 30fps로 제한

        if (!this.isPaused) {
            this.update(deltaTime);
        }

        this.render();

        this.lastUpdateTime = currentTime;
    }

    /**
     * 시뮬레이션 업데이트
     * @param {number} deltaTime 프레임 간격
     */
    update(deltaTime) {
        // 자석 업데이트
        this.magnets.forEach(magnet => {
            magnet.update(deltaTime);
        });

        // 입자 물리 업데이트
        this.updateParticles(deltaTime);

        // 입자 간 충돌 처리 (성능 고려하여 제한적으로)
        if (this.particles.length < 100) {
            this.handleParticleCollisions();
        }

        // 죽은 입자 정리
        this.cleanupDeadParticles();
    }

    /**
     * 입자들 업데이트
     * @param {number} deltaTime 프레임 간격
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            particle.update(deltaTime, this.magnets, this.physics);

            // 경계 밖으로 나간 입자 제거
            if (particle.isOutOfBounds()) {
                this.removeParticle(i);
            }
        }
    }

    /**
     * 입자 간 충돌 처리
     */
    handleParticleCollisions() {
        for (let i = 0; i < this.particles.length - 1; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                this.physics.handleParticleCollision(
                    this.particles[i],
                    this.particles[j]
                );
            }
        }
    }

    /**
     * 죽은 입자들 정리
     */
    cleanupDeadParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (this.particles[i].isDead) {
                this.removeParticle(i);
            }
        }
    }

    /**
     * 특정 입자 제거
     * @param {number} index 입자 인덱스
     */
    removeParticle(index) {
        if (index < 0 || index >= this.particles.length) return;

        const particle = this.particles[index];

        // 씬에서 메시 제거
        this.scene.remove(particle.mesh);

        // 배열에서 제거
        this.particles.splice(index, 1);

        // 객체 풀에 반환 (재사용을 위해)
        if (this.particlePool.length < 50) {
            this.particlePool.push(particle);
        }
    }

    /**
     * 가장 오래된 입자 제거
     */
    removeOldestParticle() {
        if (this.particles.length === 0) return;

        let oldestIndex = 0;
        let maxAge = this.particles[0].age;

        for (let i = 1; i < this.particles.length; i++) {
            if (this.particles[i].age > maxAge) {
                maxAge = this.particles[i].age;
                oldestIndex = i;
            }
        }

        this.removeParticle(oldestIndex);
    }

    /**
     * 렌더링
     */
    render() {
        this.scene.render();
    }

    /**
     * 모든 입자 제거
     */
    clearParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.removeParticle(i);
        }

        Utils.debug('All particles cleared');
    }

    /**
     * 전체 리셋
     */
    reset() {
        // 모든 입자 제거
        this.clearParticles();

        // 자석들을 초기 위치로
        this.magnets.forEach((magnet, index) => {
            switch (index) {
                case 0: // 막대자석
                    magnet.teleportTo(new THREE.Vector3(0, 0.5, 0));
                    break;
                case 1: // 고리자석
                    magnet.teleportTo(new THREE.Vector3(-3, 0.3, 0));
                    break;
            }
        });

        // 자석 세기 초기화
        this.onMagnetStrengthChange(1.0);

        Utils.debug('Application reset');
    }

    /**
     * 오류 메시지 표시
     * @param {string} message 오류 메시지
     */
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 600;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    /**
     * 성능 통계 반환
     * @returns {object} 성능 통계
     */
    getPerformanceStats() {
        return {
            particleCount: this.particles.length,
            magnetCount: this.magnets.length,
            fps: this.scene?.fpsCounter?.getFPS() || 0,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null
        };
    }

    /**
     * 리소스 정리
     */
    dispose() {
        Utils.debug('Disposing application...');

        // 시뮬레이션 정지
        this.stop();

        // 이벤트 리스너 제거
        document.removeEventListener('ironParticleSpawn', this.onIronParticleSpawn);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);

        // 모든 객체 제거
        this.clearParticles();
        this.magnets.forEach(magnet => magnet.dispose());
        this.magnets = [];

        // 시스템들 정리
        if (this.scene) this.scene.dispose();
        if (this.uiControls) this.uiControls.dispose();

        Utils.debug('Application disposed');
    }
}

// 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    // THREE.js가 로드될 때까지 기다림
    function initApp() {
        if (typeof THREE === 'undefined') {
            console.log('Waiting for THREE.js to load...');
            setTimeout(initApp, 100);
            return;
        }

        // 전역 애플리케이션 인스턴스 생성
        window.magneticApp = new MagneticSimulationApp();
        Utils.debug('Application loaded');
    }

    initApp();
});