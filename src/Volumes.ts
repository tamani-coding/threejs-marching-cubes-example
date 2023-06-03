import * as THREE from 'three';

export class Volume {
    
    isPointWithin(position: THREE.Vector3): boolean {
        return false;
    }

    intersectionPoint(v1: THREE.Vector3, v2: THREE.Vector3): THREE.Vector3 {
        return new THREE.Vector3();
    }
}

export class SphereVolume implements Volume {

    position: THREE.Vector3;
    radius: number;

    constructor(position: THREE.Vector3, radius: number) {
        this.position = position;
        this.radius = radius;
    }

    isPointWithin(position: THREE.Vector3): boolean {
        const distance = this.position.distanceTo(position);
        return distance <= this.radius;
    }
    
    intersectionPoint(v1: THREE.Vector3, v2: THREE.Vector3): THREE.Vector3 {
        const d1 = this.position.distanceTo(v1);
        const d2 = this.position.distanceTo(v2);

        let a,b: THREE.Vector3; 

        if (d1 < d2) {
            a = v1;
            b = v2;
        } else {
            a = v2;
            b = v1;
        }

        const distance = a.distanceTo(b);
        const t = (this.radius - a.distanceTo(this.position)) / distance;
        const result = new THREE.Vector3();
        return result.copy(a).add(b.clone().sub(a).multiplyScalar(t));
    }
}