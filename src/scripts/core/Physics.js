/**
 * 물리 엔진 클래스
 * 자기장 계산, 입자 운동, 중력 등의 물리 법칙 처리
 */

class Physics {
    constructor() {
        // 물리 상수들
        this.GRAVITY = -9.81; // 중력 가속도 (m/s²)
        this.MAGNETIC_CONSTANT = 4 * Math.PI * 1e-7; // 자기 상수
        this.DAMPING = 0.98; // 감쇠 계수
        this.AIR_RESISTANCE = 0.99; // 공기 저항
        this.MAGNETIC_FORCE_SCALE = 50; // 자기력 스케일링
        this.MIN_FORCE = 0.001; // 최소 힘
        this.MAX_FORCE = 10; // 최대 힘

        // 시뮬레이션 설정
        this.timeStep = 1/60; // 60 FPS
        this.maxVelocity = 20; // 최대 속도
        this.restitution = 0.3; // 바닥 충돌 시 반발 계수
    }

    /**
     * 두 점 사이의 자기장 계산 (쿨롱의 법칙 변형)
     * @param {THREE.Vector3} sourcePos 자석 위치
     * @param {THREE.Vector3} targetPos 철가루 위치
     * @param {number} magnetStrength 자석 세기
     * @param {string} magnetType 자석 종류 ('bar', 'ring')
     * @returns {THREE.Vector3} 자기력 벡터
     */
    calculateMagneticForce(sourcePos, targetPos, magnetStrength, magnetType = 'bar') {
        const distance = Utils.distance(sourcePos, targetPos);

        // 거리가 너무 가까우면 힘을 제한
        if (distance < 0.1) return new THREE.Vector3(0, 0, 0);

        // 거리에 따른 힘 감소 (역제곱 법칙)
        let forceMagnitude = (magnetStrength * this.MAGNETIC_FORCE_SCALE) / Math.pow(distance, 2);

        // 자석 종류에 따른 힘 계산
        if (magnetType === 'bar') {
            // 막대자석: 양극과 음극을 고려
            forceMagnitude *= this.calculateBarMagnetField(sourcePos, targetPos);
        } else if (magnetType === 'ring') {
            // 고리자석: 중심에서의 방향성 고려
            forceMagnitude *= this.calculateRingMagnetField(sourcePos, targetPos);
        }

        // 힘의 방향 계산 (자석 쪽으로)
        const direction = new THREE.Vector3()
            .subVectors(sourcePos, targetPos)
            .normalize();

        // 힘 제한
        forceMagnitude = Utils.clamp(forceMagnitude, this.MIN_FORCE, this.MAX_FORCE);

        return direction.multiplyScalar(forceMagnitude);
    }

    /**
     * 막대자석의 자기장 패턴 계산
     * @param {THREE.Vector3} magnetPos 자석 위치
     * @param {THREE.Vector3} particlePos 입자 위치
     * @returns {number} 자기장 강도 배율
     */
    calculateBarMagnetField(magnetPos, particlePos) {
        // 막대자석의 방향 (기본적으로 Y축)
        const magnetDirection = new THREE.Vector3(0, 1, 0);

        // 자석에서 입자로의 벡터
        const toParticle = new THREE.Vector3()
            .subVectors(particlePos, magnetPos)
            .normalize();

        // 자석의 방향과 입자 방향의 내적으로 극성 효과 계산
        const dotProduct = toParticle.dot(magnetDirection);

        // 극 근처에서 더 강한 자기장 (코사인 함수 변형)
        return Math.abs(Math.cos(dotProduct * Math.PI)) + 0.3;
    }

    /**
     * 고리자석의 자기장 패턴 계산
     * @param {THREE.Vector3} magnetPos 자석 위치
     * @param {THREE.Vector3} particlePos 입자 위치
     * @returns {number} 자기장 강도 배율
     */
    calculateRingMagnetField(magnetPos, particlePos) {
        // 고리자석의 중심축 (기본적으로 Y축)
        const magnetAxis = new THREE.Vector3(0, 1, 0);

        // 자석에서 입자로의 벡터
        const toParticle = new THREE.Vector3()
            .subVectors(particlePos, magnetPos);

        // 축에서의 거리 계산
        const axisDistance = Math.abs(toParticle.dot(magnetAxis));
        const radialDistance = Math.sqrt(toParticle.lengthSq() - axisDistance * axisDistance);

        // 고리 모양의 자기장 패턴
        const ringEffect = Math.exp(-Math.pow(radialDistance - 1, 2) * 2);

        return ringEffect + 0.2;
    }

    /**
     * 중력 계산
     * @param {number} mass 질량
     * @returns {THREE.Vector3} 중력 벡터
     */
    calculateGravity(mass) {
        return new THREE.Vector3(0, this.GRAVITY * mass, 0);
    }

    /**
     * 공기 저항 계산
     * @param {THREE.Vector3} velocity 속도 벡터
     * @returns {THREE.Vector3} 공기 저항 벡터
     */
    calculateAirResistance(velocity) {
        return velocity.clone().multiplyScalar(-this.AIR_RESISTANCE * velocity.length());
    }

    /**
     * 입자의 물리 업데이트
     * @param {object} particle 입자 객체
     * @param {Array} magnets 자석 배열
     * @param {number} deltaTime 시간 간격
     */
    updateParticle(particle, magnets, deltaTime) {
        // 힘 초기화
        const totalForce = new THREE.Vector3(0, 0, 0);

        // 중력 적용
        const gravity = this.calculateGravity(particle.mass);
        totalForce.add(gravity);

        // 모든 자석의 자기력 계산
        magnets.forEach(magnet => {
            const magneticForce = this.calculateMagneticForce(
                magnet.position,
                particle.position,
                magnet.strength,
                magnet.type
            );
            totalForce.add(magneticForce);
        });

        // 공기 저항 적용
        const airResistance = this.calculateAirResistance(particle.velocity);
        totalForce.add(airResistance);

        // 가속도 계산 (F = ma, a = F/m)
        const acceleration = totalForce.divideScalar(particle.mass);

        // 속도 업데이트 (v = v + a*dt)
        particle.velocity.add(acceleration.multiplyScalar(deltaTime));

        // 속도 제한
        if (particle.velocity.length() > this.maxVelocity) {
            particle.velocity.normalize().multiplyScalar(this.maxVelocity);
        }

        // 위치 업데이트 (p = p + v*dt)
        const displacement = particle.velocity.clone().multiplyScalar(deltaTime);
        particle.position.add(displacement);

        // 바닥 충돌 처리
        this.handleGroundCollision(particle);

        // 감쇠 적용
        particle.velocity.multiplyScalar(this.DAMPING);
    }

    /**
     * 바닥 충돌 처리
     * @param {object} particle 입자 객체
     */
    handleGroundCollision(particle) {
        const groundLevel = 0;

        if (particle.position.y <= groundLevel) {
            particle.position.y = groundLevel;

            // 수직 속도 반전 및 감쇠
            if (particle.velocity.y < 0) {
                particle.velocity.y = -particle.velocity.y * this.restitution;
            }

            // 수평 속도 마찰 적용
            particle.velocity.x *= 0.8;
            particle.velocity.z *= 0.8;
        }
    }

    /**
     * 두 입자 간의 충돌 감지 및 처리
     * @param {object} particle1 첫 번째 입자
     * @param {object} particle2 두 번째 입자
     */
    handleParticleCollision(particle1, particle2) {
        const distance = Utils.distance(particle1.position, particle2.position);
        const minDistance = (particle1.radius + particle2.radius);

        if (distance < minDistance && distance > 0) {
            // 충돌 방향 계산
            const collisionDirection = new THREE.Vector3()
                .subVectors(particle2.position, particle1.position)
                .normalize();

            // 입자들을 분리
            const overlap = minDistance - distance;
            const separation = collisionDirection.clone().multiplyScalar(overlap * 0.5);

            particle1.position.sub(separation);
            particle2.position.add(separation);

            // 속도 교환 (단순한 탄성 충돌)
            const relativeVelocity = new THREE.Vector3()
                .subVectors(particle1.velocity, particle2.velocity);

            const velocityAlongNormal = relativeVelocity.dot(collisionDirection);

            if (velocityAlongNormal > 0) return; // 이미 분리되는 중

            const impulse = 2 * velocityAlongNormal / (particle1.mass + particle2.mass);

            particle1.velocity.sub(
                collisionDirection.clone().multiplyScalar(impulse * particle2.mass)
            );
            particle2.velocity.add(
                collisionDirection.clone().multiplyScalar(impulse * particle1.mass)
            );
        }
    }

    /**
     * 자기력선 계산 (시각화용)
     * @param {THREE.Vector3} magnetPos 자석 위치
     * @param {number} magnetStrength 자석 세기
     * @param {string} magnetType 자석 종류
     * @returns {Array} 자기력선 포인트 배열
     */
    calculateFieldLines(magnetPos, magnetStrength, magnetType) {
        const fieldLines = [];
        const numLines = 8; // 자기력선 개수
        const stepSize = 0.1; // 스텝 크기
        const maxSteps = 100; // 최대 스텝 수

        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const startRadius = 0.2;

            const startPos = new THREE.Vector3(
                magnetPos.x + Math.cos(angle) * startRadius,
                magnetPos.y,
                magnetPos.z + Math.sin(angle) * startRadius
            );

            const line = [startPos.clone()];
            let currentPos = startPos.clone();

            for (let step = 0; step < maxSteps; step++) {
                const force = this.calculateMagneticForce(
                    magnetPos, currentPos, magnetStrength, magnetType
                );

                if (force.length() < 0.001) break;

                const direction = force.normalize();
                currentPos.add(direction.multiplyScalar(stepSize));
                line.push(currentPos.clone());

                // 너무 멀어지면 중단
                if (Utils.distance(magnetPos, currentPos) > 5) break;
            }

            fieldLines.push(line);
        }

        return fieldLines;
    }
}