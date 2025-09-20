/**
 * UI 컨트롤러 클래스
 * 사용자 인터페이스 요소들의 이벤트 처리 및 상태 관리
 */

class UIControls {
    constructor(app) {
        this.app = app; // 메인 애플리케이션 참조

        // UI 요소들
        this.elements = {
            strengthSlider: document.getElementById('magnet-strength'),
            strengthValue: document.getElementById('strength-value'),
            resetBtn: document.getElementById('reset-btn'),
            clearParticlesBtn: document.getElementById('clear-particles-btn'),
            loadingScreen: document.getElementById('loading')
        };

        // 상태
        this.magnetStrength = 1.0;

        // 이벤트 바인딩
        this.bindEvents();

        Utils.debug('UI Controls initialized');
    }

    /**
     * 이벤트 리스너 바인딩
     */
    bindEvents() {
        // 자석 세기 슬라이더
        if (this.elements.strengthSlider) {
            this.elements.strengthSlider.addEventListener('input', (e) => {
                this.onStrengthChange(parseFloat(e.target.value));
            });

            this.elements.strengthSlider.addEventListener('change', (e) => {
                this.onStrengthChange(parseFloat(e.target.value));
            });
        }

        // 리셋 버튼
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => {
                this.onReset();
            });
        }

        // 철가루 제거 버튼
        if (this.elements.clearParticlesBtn) {
            this.elements.clearParticlesBtn.addEventListener('click', () => {
                this.onClearParticles();
            });
        }

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            this.onKeyDown(e);
        });

        // 터치 디바이스 지원
        if (Utils.isMobile()) {
            this.setupTouchEvents();
        }

        Utils.debug('UI Events bound');
    }

    /**
     * 자석 세기 변경 처리
     * @param {number} value 새로운 세기 값
     */
    onStrengthChange(value) {
        this.magnetStrength = value;

        // 값 표시 업데이트
        if (this.elements.strengthValue) {
            this.elements.strengthValue.textContent = value.toFixed(1);
        }

        // 애플리케이션에 변경사항 알림
        if (this.app && this.app.onMagnetStrengthChange) {
            this.app.onMagnetStrengthChange(value);
        }

        Utils.debug(`Magnet strength changed to: ${value}`);
    }

    /**
     * 리셋 버튼 처리
     */
    onReset() {
        if (this.app && this.app.reset) {
            this.app.reset();
        }

        // UI도 초기 상태로
        this.resetUI();

        Utils.debug('Application reset');
    }

    /**
     * 철가루 제거 버튼 처리
     */
    onClearParticles() {
        if (this.app && this.app.clearParticles) {
            this.app.clearParticles();
        }

        Utils.debug('Particles cleared');
    }

    /**
     * 키보드 이벤트 처리
     * @param {KeyboardEvent} event 키보드 이벤트
     */
    onKeyDown(event) {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.onClearParticles();
                break;

            case 'KeyR':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.onReset();
                }
                break;

            case 'ArrowUp':
                event.preventDefault();
                this.adjustMagnetStrength(0.1);
                break;

            case 'ArrowDown':
                event.preventDefault();
                this.adjustMagnetStrength(-0.1);
                break;

            case 'Digit1':
                this.setMagnetStrength(0.5);
                break;

            case 'Digit2':
                this.setMagnetStrength(1.0);
                break;

            case 'Digit3':
                this.setMagnetStrength(1.5);
                break;

            case 'Digit4':
                this.setMagnetStrength(2.0);
                break;

            case 'KeyH':
                this.toggleHelp();
                break;

            case 'KeyD':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.toggleDebugMode();
                }
                break;
        }
    }

    /**
     * 자석 세기 조절
     * @param {number} delta 변화량
     */
    adjustMagnetStrength(delta) {
        const newValue = Utils.clamp(this.magnetStrength + delta, 0.1, 2.0);
        this.setMagnetStrength(newValue);
    }

    /**
     * 자석 세기 설정
     * @param {number} value 새로운 값
     */
    setMagnetStrength(value) {
        value = Utils.clamp(value, 0.1, 2.0);

        if (this.elements.strengthSlider) {
            this.elements.strengthSlider.value = value;
        }

        this.onStrengthChange(value);
    }

    /**
     * 터치 이벤트 설정 (모바일 지원)
     */
    setupTouchEvents() {
        let lastTap = 0;

        // 더블 탭으로 리셋
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                this.onReset();
            }

            lastTap = currentTime;
        });

        // 두 손가락 핀치로 자석 세기 조절
        let initialDistance = 0;
        let initialStrength = this.magnetStrength;

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialDistance = Math.sqrt(dx * dx + dy * dy);
                initialStrength = this.magnetStrength;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();

                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const currentDistance = Math.sqrt(dx * dx + dy * dy);

                const distanceRatio = currentDistance / initialDistance;
                const newStrength = Utils.clamp(initialStrength * distanceRatio, 0.1, 2.0);

                this.setMagnetStrength(newStrength);
            }
        });

        Utils.debug('Touch events configured');
    }

    /**
     * 도움말 토글
     */
    toggleHelp() {
        const helpExists = document.getElementById('help-modal');

        if (helpExists) {
            helpExists.remove();
            return;
        }

        const helpModal = document.createElement('div');
        helpModal.id = 'help-modal';
        helpModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        helpModal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <h2 style="margin-top: 0; color: #333;">사용 방법</h2>

                <h3 style="color: #667eea;">마우스 조작</h3>
                <ul style="line-height: 1.6;">
                    <li><strong>클릭:</strong> 철가루 뿌리기</li>
                    <li><strong>드래그:</strong> 자석 이동</li>
                    <li><strong>휠:</strong> 확대/축소</li>
                    <li><strong>우클릭 드래그:</strong> 시점 회전</li>
                </ul>

                <h3 style="color: #667eea;">키보드 단축키</h3>
                <ul style="line-height: 1.6;">
                    <li><strong>스페이스바:</strong> 철가루 제거</li>
                    <li><strong>Ctrl+R:</strong> 전체 리셋</li>
                    <li><strong>↑↓:</strong> 자석 세기 조절</li>
                    <li><strong>1-4:</strong> 자석 세기 프리셋</li>
                    <li><strong>H:</strong> 도움말 토글</li>
                    <li><strong>Ctrl+D:</strong> 디버그 모드</li>
                </ul>

                <h3 style="color: #667eea;">모바일</h3>
                <ul style="line-height: 1.6;">
                    <li><strong>더블 탭:</strong> 리셋</li>
                    <li><strong>핀치:</strong> 자석 세기 조절</li>
                </ul>

                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-top: 20px;
                    font-size: 16px;
                ">닫기</button>
            </div>
        `;

        // 모달 외부 클릭시 닫기
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.remove();
            }
        });

        document.body.appendChild(helpModal);
    }

    /**
     * 디버그 모드 토글
     */
    toggleDebugMode() {
        window.DEBUG_MODE = !window.DEBUG_MODE;

        const debugInfo = document.getElementById('debug-info');

        if (window.DEBUG_MODE && !debugInfo) {
            this.createDebugPanel();
        } else if (!window.DEBUG_MODE && debugInfo) {
            debugInfo.remove();
        }

        Utils.debug(`Debug mode: ${window.DEBUG_MODE ? 'ON' : 'OFF'}`);
    }

    /**
     * 디버그 패널 생성
     */
    createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-info';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 999;
            min-width: 200px;
        `;

        document.body.appendChild(debugPanel);

        // 디버그 정보 업데이트
        this.updateDebugInfo();
    }

    /**
     * 디버그 정보 업데이트
     */
    updateDebugInfo() {
        const debugPanel = document.getElementById('debug-info');
        if (!debugPanel || !window.DEBUG_MODE) return;

        const fps = this.app?.scene?.fpsCounter?.getFPS() || 0;
        const particleCount = this.app?.particles?.length || 0;
        const magnetCount = this.app?.magnets?.length || 0;

        debugPanel.innerHTML = `
            <div><strong>FPS:</strong> ${fps}</div>
            <div><strong>Particles:</strong> ${particleCount}</div>
            <div><strong>Magnets:</strong> ${magnetCount}</div>
            <div><strong>Strength:</strong> ${this.magnetStrength.toFixed(1)}</div>
            <div><strong>Memory:</strong> ${this.getMemoryUsage()}</div>
        `;

        // 1초마다 업데이트
        setTimeout(() => this.updateDebugInfo(), 1000);
    }

    /**
     * 메모리 사용량 계산 (추정)
     * @returns {string} 메모리 사용량
     */
    getMemoryUsage() {
        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const total = performance.memory.totalJSHeapSize;
            return `${Math.round(used / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB`;
        }
        return 'N/A';
    }

    /**
     * 로딩 화면 숨기기
     */
    hideLoading() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.add('hidden');

            // 완전히 제거
            setTimeout(() => {
                if (this.elements.loadingScreen.parentNode) {
                    this.elements.loadingScreen.parentNode.removeChild(this.elements.loadingScreen);
                }
            }, 500);
        }
    }

    /**
     * UI 초기 상태로 리셋
     */
    resetUI() {
        this.setMagnetStrength(1.0);
    }

    /**
     * 알림 메시지 표시
     * @param {string} message 메시지
     * @param {string} type 타입 ('info', 'warning', 'error')
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa44' : '#44ff44'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1001;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;

        notification.textContent = message;

        document.body.appendChild(notification);

        // 3초 후 자동 제거
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 리소스 정리
     */
    dispose() {
        // 이벤트 리스너 제거
        document.removeEventListener('keydown', this.onKeyDown);

        // 디버그 패널 제거
        const debugPanel = document.getElementById('debug-info');
        if (debugPanel) {
            debugPanel.remove();
        }

        Utils.debug('UI Controls disposed');
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);