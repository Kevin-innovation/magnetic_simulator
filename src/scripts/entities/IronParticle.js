/**
 * 철가루 입자 클래스
 * 개별 철가루 입자의 물리 속성과 렌더링을 담당
 */

class IronParticle {
    constructor(position, options = {}) {
        // 기본 옵션
        const defaults = {
            radius: 0.02,
            mass: 0.1,
            color: 0x2C2C2C, // 어두운 회색 (철 색상)
            metalness: 0.8,
            roughness: 0.2
        };

        this.options = { ...defaults, ...options };

        // 물리 속성
        this.position = position.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.mass = this.options.mass;
        this.radius = this.options.radius;

        // 생명주기
        this.age = 0;
        this.maxAge = Infinity; // 기본적으로 무한 생존
        this.isDead = false;

        // 상태
        this.isAttractedToMagnet = false;
        this.currentMagnet = null;
        this.stuckToGround = false;

        // 3D 메시 생성
        this.mesh = this.createMesh();

        // 성능 최적화용 플래그
        this.needsUpdate = true;
        this.lastUpdateTime = 0;
    }

    /**
     * 3D 메시 생성
     * @returns {THREE.Mesh} 철가루 메시
     */
    createMesh() {
        // 구체 지오메트리 (낮은 디테일로 성능 최적화)
        const geometry = new THREE.SphereGeometry(this.radius, 8, 6);

        // 철 재질
        const material = new THREE.MeshStandardMaterial({
            color: this.options.color,
            metalness: this.options.metalness,
            roughness: this.options.roughness,
            envMapIntensity: 0.5
        });

        const mesh = new THREE.Mesh(geometry, material);

        // 위치 설정
        mesh.position.copy(this.position);

        // 그림자 설정
        mesh.castShadow = true;
        mesh.receiveShadow = false;

        // 사용자 데이터 설정 (식별용)
        mesh.userData.type = 'ironParticle';
        mesh.userData.particle = this;

        return mesh;
    }

    /**
     * 입자 물리 업데이트
     * @param {number} deltaTime 프레임 간격
     * @param {Array} magnets 자석 배열
     * @param {Physics} physics 물리 엔진
     */
    update(deltaTime, magnets, physics) {
        if (this.isDead) return;

        // 나이 증가
        this.age += deltaTime;

        // 수명 체크
        if (this.age > this.maxAge) {
            this.kill();
            return;
        }

        // 물리 계산
        physics.updateParticle(this, magnets, deltaTime);

        // 메시 위치 업데이트
        this.updateMesh();

        // 자석 상호작용 체크
        this.checkMagnetInteraction(magnets);

        // 바닥에 붙어있는지 체크
        this.checkGroundStick();

        this.needsUpdate = false;
    }

    /**
     * 메시 위치 업데이트
     */
    updateMesh() {
        if (this.mesh) {
            this.mesh.position.copy(this.position);

            // 속도에 따른 회전 효과 (시각적 개선)
            if (this.velocity.length() > 0.1) {
                this.mesh.rotation.x += this.velocity.y * 0.1;
                this.mesh.rotation.z += this.velocity.x * 0.1;
            }
        }
    }

    /**
     * 자석과의 상호작용 체크
     * @param {Array} magnets 자석 배열
     */
    checkMagnetInteraction(magnets) {
        let closestMagnet = null;
        let closestDistance = Infinity;

        magnets.forEach(magnet => {
            const distance = Utils.distance(this.position, magnet.position);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestMagnet = magnet;
            }
        });

        // 자석에 매우 가까우면 끌어당김 상태
        if (closestDistance < 0.5) {
            this.isAttractedToMagnet = true;
            this.currentMagnet = closestMagnet;

            // 자석에 붙어버림 (매우 가까울 때)
            if (closestDistance < 0.1) {
                this.velocity.multiplyScalar(0.1); // 급속히 감속
            }
        } else {
            this.isAttractedToMagnet = false;
            this.currentMagnet = null;
        }
    }

    /**
     * 바닥에 붙어있는지 체크
     */
    checkGroundStick() {
        if (this.position.y <= 0.01 && this.velocity.length() < 0.1) {
            this.stuckToGround = true;
            this.velocity.multiplyScalar(0.5); // 더 빠른 감속
        } else {
            this.stuckToGround = false;
        }
    }

    /**
     * 외부 힘 적용
     * @param {THREE.Vector3} force 힘 벡터
     */
    applyForce(force) {
        // F = ma, a = F/m
        const acceleration = force.clone().divideScalar(this.mass);
        this.acceleration.add(acceleration);
        this.needsUpdate = true;
    }

    /**
     * 입자에 임펄스 적용 (즉시 속도 변화)
     * @param {THREE.Vector3} impulse 임펄스 벡터
     */
    applyImpulse(impulse) {
        const velocityChange = impulse.clone().divideScalar(this.mass);
        this.velocity.add(velocityChange);
        this.needsUpdate = true;
    }

    /**
     * 입자를 특정 위치로 순간이동
     * @param {THREE.Vector3} newPosition 새 위치
     */
    teleportTo(newPosition) {
        this.position.copy(newPosition);
        this.velocity.set(0, 0, 0);
        this.updateMesh();
    }

    /**
     * 입자 색상 변경
     * @param {number} color 새 색상 (16진수)
     */
    setColor(color) {
        if (this.mesh && this.mesh.material) {
            this.mesh.material.color.setHex(color);
        }
    }

    /**
     * 입자 크기 변경
     * @param {number} scale 스케일 배율
     */
    setScale(scale) {
        if (this.mesh) {
            this.mesh.scale.setScalar(scale);
        }
    }

    /**
     * 자기화 효과 (자석 근처에서)
     */
    magnetize() {
        if (!this.isAttractedToMagnet) return;

        // 자기화된 입자는 색상이 약간 변함
        this.setColor(0x1a1a1a); // 더 어두운 색상

        // 자기화된 입자는 다른 입자를 약간 끌어당김
        // (구현 시 다른 입자들과의 상호작용에서 처리)
    }

    /**
     * 자기화 해제
     */
    demagnetize() {
        // 원래 색상으로 복원
        this.setColor(this.options.color);
    }

    /**
     * 입자가 화면 밖으로 나갔는지 체크
     * @param {number} boundary 경계 거리
     * @returns {boolean} 경계 밖 여부
     */
    isOutOfBounds(boundary = 15) {
        return (
            Math.abs(this.position.x) > boundary ||
            Math.abs(this.position.z) > boundary ||
            this.position.y < -5 ||
            this.position.y > boundary
        );
    }

    /**
     * 입자 제거
     */
    kill() {
        this.isDead = true;

        // 메시 제거는 파티클 시스템에서 처리
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }

        // 메모리 정리
        if (this.mesh) {
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                this.mesh.material.dispose();
            }
        }
    }

    /**
     * 입자 복제 (파티클 풀링용)
     * @param {THREE.Vector3} newPosition 새 위치
     * @returns {IronParticle} 복제된 입자
     */
    clone(newPosition) {
        const newParticle = new IronParticle(newPosition, this.options);
        return newParticle;
    }

    /**
     * 입자 정보 반환 (디버깅용)
     * @returns {object} 입자 정보
     */
    getInfo() {
        return {
            position: this.position.clone(),
            velocity: this.velocity.clone(),
            mass: this.mass,
            age: this.age,
            isAttracted: this.isAttractedToMagnet,
            stuckToGround: this.stuckToGround,
            isDead: this.isDead
        };
    }
}