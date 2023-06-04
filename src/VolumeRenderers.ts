import * as THREE from 'three';

export class MeshRenderer {
            
    meshBufferGeometry: THREE.BufferGeometry;

    constructor(scene: THREE.Scene) {
        this.meshBufferGeometry = new THREE.BufferGeometry();
        this.meshBufferGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [], 3 ) );
        const mesh = new THREE.Mesh( this.meshBufferGeometry, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add( mesh );
    }

    updateMesh(trianglePoints: THREE.Vector3[]) {
        const vertices = [];
        for (const intersectPoint of trianglePoints) {
            const x = intersectPoint.x;
            const y = intersectPoint.y;
            const z = intersectPoint.z;
        
            vertices.push( x, y, z );
        }
        const positionAttribute = new THREE.Float32BufferAttribute( vertices, 3 );
        positionAttribute.setUsage( THREE.DynamicDrawUsage );
        this.meshBufferGeometry.setAttribute( 'position',  positionAttribute);
        this.meshBufferGeometry.computeVertexNormals();
    }
}