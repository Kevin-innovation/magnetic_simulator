/**
 * 유틸리티 함수 모음
 * 수학 계산, 벡터 연산, 헬퍼 함수들
 */

class Utils {
    /**
     * 두 벡터 사이의 거리 계산
     * @param {THREE.Vector3} v1 첫 번째 벡터
     * @param {THREE.Vector3} v2 두 번째 벡터
     * @returns {number} 거리
     */
    static distance(v1, v2) {
        return Math.sqrt(
            Math.pow(v2.x - v1.x, 2) +
            Math.pow(v2.y - v1.y, 2) +
            Math.pow(v2.z - v1.z, 2)
        );
    }

    /**
     * 값을 특정 범위로 제한
     * @param {number} value 값
     * @param {number} min 최솟값
     * @param {number} max 최댓값
     * @returns {number} 제한된 값
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * 선형 보간
     * @param {number} a 시작값
     * @param {number} b 끝값
     * @param {number} t 보간값 (0-1)
     * @returns {number} 보간된 값
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * 두 값 사이의 선형 매핑
     * @param {number} value 입력값
     * @param {number} inMin 입력 최솟값
     * @param {number} inMax 입력 최댓값
     * @param {number} outMin 출력 최솟값
     * @param {number} outMax 출력 최댓값
     * @returns {number} 매핑된 값
     */
    static map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    /**
     * 랜덤 값 생성 (min과 max 사이)
     * @param {number} min 최솟값
     * @param {number} max 최댓값
     * @returns {number} 랜덤값
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * 랜덤 정수 생성
     * @param {number} min 최솟값
     * @param {number} max 최댓값
     * @returns {number} 랜덤 정수
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 벡터 정규화
     * @param {THREE.Vector3} vector 벡터
     * @returns {THREE.Vector3} 정규화된 벡터
     */
    static normalize(vector) {
        const length = vector.length();
        if (length === 0) return new THREE.Vector3(0, 0, 0);
        return vector.clone().divideScalar(length);
    }

    /**
     * 도를 라디안으로 변환
     * @param {number} degrees 도
     * @returns {number} 라디안
     */
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * 라디안을 도로 변환
     * @param {number} radians 라디안
     * @returns {number} 도
     */
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    /**
     * 색상 값을 16진수로 변환
     * @param {number} r 빨강 (0-255)
     * @param {number} g 초록 (0-255)
     * @param {number} b 파랑 (0-255)
     * @returns {number} 16진수 색상
     */
    static rgbToHex(r, g, b) {
        return (r << 16) | (g << 8) | b;
    }

    /**
     * HSL을 RGB로 변환
     * @param {number} h 색조 (0-360)
     * @param {number} s 채도 (0-100)
     * @param {number} l 명도 (0-100)
     * @returns {object} {r, g, b} 객체
     */
    static hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * 디바이스 픽셀 비율 가져오기 (고해상도 디스플레이 대응)
     * @returns {number} 픽셀 비율
     */
    static getPixelRatio() {
        return Math.min(window.devicePixelRatio || 1, 2);
    }

    /**
     * 브라우저가 WebGL을 지원하는지 확인
     * @returns {boolean} WebGL 지원 여부
     */
    static isWebGLSupported() {
        try {
            const canvas = document.createElement('canvas');
            return !!(
                window.WebGLRenderingContext &&
                canvas.getContext('webgl')
            );
        } catch (e) {
            return false;
        }
    }

    /**
     * 모바일 디바이스 감지
     * @returns {boolean} 모바일 여부
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    }

    /**
     * FPS 카운터
     */
    static createFPSCounter() {
        let lastTime = performance.now();
        let frames = 0;
        let fps = 0;

        return {
            update() {
                frames++;
                const now = performance.now();
                if (now >= lastTime + 1000) {
                    fps = Math.round((frames * 1000) / (now - lastTime));
                    frames = 0;
                    lastTime = now;
                }
                return fps;
            },
            getFPS() {
                return fps;
            }
        };
    }

    /**
     * 디버그 로그 (개발 모드에서만)
     * @param {string} message 메시지
     * @param {any} data 추가 데이터
     */
    static debug(message, data = null) {
        if (window.DEBUG_MODE) {
            console.log(`[DEBUG] ${message}`, data);
        }
    }

    /**
     * 오류 로그
     * @param {string} message 메시지
     * @param {Error} error 오류 객체
     */
    static error(message, error = null) {
        console.error(`[ERROR] ${message}`, error);
    }

    /**
     * 경고 로그
     * @param {string} message 메시지
     */
    static warn(message) {
        console.warn(`[WARN] ${message}`);
    }
}

// 전역 디버그 모드 설정
window.DEBUG_MODE = true;