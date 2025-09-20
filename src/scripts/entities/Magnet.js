/**
 * 자석 클래스
 * 자석의 물리 속성, 렌더링, 상호작용을 담당
 */

class Magnet {
    constructor(position, type = 'bar', options = {}) {
        // 기본 옵션
        const defaults = {
            strength: 1.0,
            size: { width: 0.3, height: 1.0, depth: 0.3 },
            colors: {
                north: 0xff4444, // 빨간색 (N극)
                south: 0x4444ff  // 파란색 (S극)
            },
            draggable: true
        };

        this.options = { ...defaults, ...options };

        // 기본 속성
        this.type = type; // 'bar', 'ring', 'horseshoe'
        this.position = position.clone();
        this.rotation = new THREE.Euler(0, 0, 0);
        this.strength = this.options.strength;

        // 상호작용 상태
        this.isDragging = false;
        this.isHovered = false;
        this.dragOffset = new THREE.Vector3();

        // 3D 메시 생성
        this.group = new THREE.Group();
        this.createMesh();

        // 마우스 상호작용용
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // 이벤트 바인딩
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    /**
     * 자석 타입에 따른 3D 메시 생성
     */
    createMesh() {
        this.group.position.copy(this.position);

        switch (this.type) {
            case 'bar':
                this.createBarMagnet();
                break;
            case 'ring':
                this.createRingMagnet();
                break;
            case 'horseshoe':
                this.createHorseshoeMagnet();
                break;
            default:
                this.createBarMagnet();
        }

        // 사용자 데이터 설정
        this.group.userData.type = 'magnet';
        this.group.userData.magnet = this;

        // 그림자 설정
        this.group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    /**
     * 막대자석 생성
     */
    createBarMagnet() {
        const { width, height, depth } = this.options.size;
        const halfHeight = height / 2;

        // N극 (빨간색, 위쪽)
        const northGeometry = new THREE.BoxGeometry(width, halfHeight, depth);
        const northMaterial = new THREE.MeshStandardMaterial({
            color: this.options.colors.north,
            metalness: 0.7,
            roughness: 0.3
        });
        const northMesh = new THREE.Mesh(northGeometry, northMaterial);
        northMesh.position.y = halfHeight / 2;

        // S극 (파란색, 아래쪽)
        const southGeometry = new THREE.BoxGeometry(width, halfHeight, depth);
        const southMaterial = new THREE.MeshStandardMaterial({
            color: this.options.colors.south,
            metalness: 0.7,
            roughness: 0.3
        });
        const southMesh = new THREE.Mesh(southGeometry, southMaterial);
        southMesh.position.y = -halfHeight / 2;

        // 극 표시 텍스트 (선택적)
        this.addPoleLabels(northMesh, southMesh);

        this.group.add(northMesh);
        this.group.add(southMesh);

        // 메시 참조 저장
        this.northMesh = northMesh;
        this.southMesh = southMesh;
    }

    /**
     * 고리자석 생성
     */
    createRingMagnet() {
        const outerRadius = 0.6;
        const innerRadius = 0.3;
        const height = 0.2;

        // 외부 고리 (N극)
        const outerGeometry = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 16);
        const outerMaterial = new THREE.MeshStandardMaterial({
            color: this.options.colors.north,
            metalness: 0.7,
            roughness: 0.3
        });
        const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);

        // 내부 구멍 (S극)
        const innerGeometry = new THREE.CylinderGeometry(innerRadius, innerRadius, height + 0.01, 16);
        const innerMaterial = new THREE.MeshStandardMaterial({
            color: this.options.colors.south,
            metalness: 0.7,
            roughness: 0.3
        });
        const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);

        // 불린 연산으로 고리 모양 만들기 (간단한 방법)
        this.group.add(outerMesh);
        this.group.add(innerMesh);

        this.northMesh = outerMesh;
        this.southMesh = innerMesh;
    }

    /**
     * 말굽자석 생성
     */
    createHorseshoeMagnet() {
        const radius = 0.5;
        const thickness = 0.1;
        const height = 0.8;

        // U자 모양의 곡선 생성
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(-radius, 0, 0),
            new THREE.Vector3(0, -radius, 0),
            new THREE.Vector3(radius, 0, 0)
        );

        // 곡선을 따라 튜브 생성
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, thickness, 8, false);
        const tubeMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888, // 회색 (기본 철)
            metalness: 0.8,
            roughness: 0.2
        });
        const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

        // 양쪽 끝에 극 표시
        const poleRadius = thickness * 1.5;

        // N극 (왼쪽 끝)
        const northGeometry = new THREE.SphereGeometry(poleRadius, 8, 8);
        const northMaterial = new THREE.MeshStandardMaterial({
            color: this.options.colors.north
        });
        const northMesh = new THREE.Mesh(northGeometry, northMaterial);
        northMesh.position.set(-radius, 0, 0);

        // S극 (오른쪽 끝)
        const southGeometry = new THREE.SphereGeometry(poleRadius, 8, 8);
        const southMaterial = new THREE.MeshStandardMaterial({
            color: this.options.colors.south
        });
        const southMesh = new THREE.Mesh(southGeometry, southMaterial);
        southMesh.position.set(radius, 0, 0);

        this.group.add(tubeMesh);
        this.group.add(northMesh);
        this.group.add(southMesh);

        this.northMesh = northMesh;
        this.southMesh = southMesh;
        this.bodyMesh = tubeMesh;
    }

    /**
     * 극 표시 라벨 추가
     * @param {THREE.Mesh} northMesh N극 메시
     * @param {THREE.Mesh} southMesh S극 메시
     */
    addPoleLabels(northMesh, southMesh) {
        // 텍스트는 복잡하므로 간단한 기하학적 표시로 대체

        // N극 표시 (작은 큐브)
        const nLabelGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const nLabelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const nLabel = new THREE.Mesh(nLabelGeometry, nLabelMaterial);
        nLabel.position.set(0, 0, this.options.size.depth / 2 + 0.03);
        northMesh.add(nLabel);

        // S극 표시 (작은 구)
        const sLabelGeometry = new THREE.SphereGeometry(0.025, 8, 8);
        const sLabelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const sLabel = new THREE.Mesh(sLabelGeometry, sLabelMaterial);
        sLabel.position.set(0, 0, this.options.size.depth / 2 + 0.03);
        southMesh.add(sLabel);
    }

    /**
     * 자석 업데이트
     * @param {number} deltaTime 프레임 간격
     */
    update(deltaTime) {
        // 호버 효과
        if (this.isHovered) {
            this.group.scale.setScalar(1.05);
        } else {
            this.group.scale.setScalar(1.0);
        }

        // 드래그 중일 때 약간의 회전 효과
        if (this.isDragging) {
            this.group.rotation.y += deltaTime * 0.5;
        }

        // 위치 동기화
        this.group.position.copy(this.position);
    }

    /**
     * 마우스 다운 이벤트 처리
     * @param {Event} event 마우스 이벤트
     * @param {THREE.Camera} camera 카메라
     */
    onMouseDown(event, camera) {
        if (!this.options.draggable) return;

        // 레이캐스팅으로 클릭 감지
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, camera);
        const intersects = this.raycaster.intersectObject(this.group, true);

        if (intersects.length > 0) {
            this.isDragging = true;

            // 드래그 오프셋 계산
            const intersectPoint = intersects[0].point;
            this.dragOffset.subVectors(this.position, intersectPoint);

            // 커서 변경
            document.body.style.cursor = 'grabbing';

            // 이벤트 전파 방지
            event.stopPropagation();

            return true; // 클릭됨을 표시
        }

        return false;
    }

    /**
     * 마우스 이동 이벤트 처리
     * @param {Event} event 마우스 이벤트
     * @param {THREE.Camera} camera 카메라
     * @param {THREE.Plane} groundPlane 바닥 평면
     */
    onMouseMove(event, camera, groundPlane) {
        if (!this.isDragging) return;

        // 마우스 위치를 월드 좌표로 변환
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, camera);

        const intersectPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(groundPlane, intersectPoint);

        if (intersectPoint) {
            // 새 위치 계산
            const newPosition = intersectPoint.add(this.dragOffset);

            // Y 위치는 자석 높이의 절반으로 고정
            newPosition.y = this.options.size.height / 2;

            this.position.copy(newPosition);
        }
    }

    /**
     * 마우스 업 이벤트 처리
     */
    onMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            document.body.style.cursor = 'default';
        }
    }

    /**
     * 호버 상태 설정
     * @param {boolean} hovered 호버 여부
     */
    setHovered(hovered) {
        this.isHovered = hovered;

        if (hovered) {
            document.body.style.cursor = 'grab';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    /**
     * 자석 세기 설정
     * @param {number} strength 세기 (0.1 ~ 2.0)
     */
    setStrength(strength) {
        this.strength = Utils.clamp(strength, 0.1, 2.0);

        // 시각적 피드백 (세기에 따른 발광 효과)
        const emissiveIntensity = Utils.map(this.strength, 0.1, 2.0, 0, 0.3);

        if (this.northMesh && this.northMesh.material) {
            this.northMesh.material.emissive.setHex(0x330000);
            this.northMesh.material.emissiveIntensity = emissiveIntensity;
        }

        if (this.southMesh && this.southMesh.material) {
            this.southMesh.material.emissive.setHex(0x000033);
            this.southMesh.material.emissiveIntensity = emissiveIntensity;
        }
    }

    /**
     * 자석 회전
     * @param {number} x X축 회전 (라디안)
     * @param {number} y Y축 회전 (라디안)
     * @param {number} z Z축 회전 (라디안)
     */
    setRotation(x, y, z) {
        this.rotation.set(x, y, z);
        this.group.rotation.copy(this.rotation);
    }

    /**
     * 특정 위치로 순간이동
     * @param {THREE.Vector3} newPosition 새 위치
     */
    teleportTo(newPosition) {
        this.position.copy(newPosition);
        this.group.position.copy(this.position);
    }

    /**
     * 자석의 N극 위치 계산
     * @returns {THREE.Vector3} N극 위치
     */
    getNorthPolePosition() {
        switch (this.type) {
            case 'bar':
                return this.position.clone().add(new THREE.Vector3(0, this.options.size.height / 4, 0));
            case 'ring':
                return this.position.clone();
            case 'horseshoe':
                return this.position.clone().add(new THREE.Vector3(-0.5, 0, 0));
            default:
                return this.position.clone();
        }
    }

    /**
     * 자석의 S극 위치 계산
     * @returns {THREE.Vector3} S극 위치
     */
    getSouthPolePosition() {
        switch (this.type) {
            case 'bar':
                return this.position.clone().add(new THREE.Vector3(0, -this.options.size.height / 4, 0));
            case 'ring':
                return this.position.clone();
            case 'horseshoe':
                return this.position.clone().add(new THREE.Vector3(0.5, 0, 0));
            default:
                return this.position.clone();
        }
    }

    /**
     * 자석 정보 반환 (디버깅용)
     * @returns {object} 자석 정보
     */
    getInfo() {
        return {
            type: this.type,
            position: this.position.clone(),
            rotation: this.rotation.clone(),
            strength: this.strength,
            isDragging: this.isDragging,
            isHovered: this.isHovered
        };
    }

    /**
     * 자석 제거
     */
    dispose() {
        // 메시 제거
        if (this.group && this.group.parent) {
            this.group.parent.remove(this.group);
        }

        // 메모리 정리
        this.group.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            }
        });
    }
}