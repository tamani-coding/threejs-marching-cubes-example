export class Volume {
    
    isPointWithin(position: THREE.Vector3): boolean {
        return false;
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
        return distance < this.radius;
    }
    
}