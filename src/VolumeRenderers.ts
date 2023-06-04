import * as THREE from 'three';

export class MeshRenderer {
            
    maxPolygons = 30000;
    vertices = Array(3 * this.maxPolygons).fill(0);
    meshBufferGeometry: THREE.BufferGeometry;

    constructor(scene: THREE.Scene) {
        const buffer = new THREE.Float32BufferAttribute( this.vertices, 3 );
        buffer.setUsage( THREE.DynamicDrawUsage );
        this.meshBufferGeometry = new THREE.BufferGeometry();
        this.meshBufferGeometry.setAttribute( 'position', buffer );
        const mesh = new THREE.Mesh( this.meshBufferGeometry, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add( mesh );
    }

    updateMesh(trianglePoints: THREE.Vector3[]) {
        for (let i = 0; i < trianglePoints.length; i++) {
            const x = trianglePoints[i].x;
            const y = trianglePoints[i].y;
            const z = trianglePoints[i].z;
        
            this.vertices[i * 3] = x;
            this.vertices[i * 3 +1] = y;
            this.vertices[i * 3 +2] = z;
        }
        const positionAttribute = new THREE.Float32BufferAttribute( this.vertices, 3 );
        positionAttribute.setUsage( THREE.DynamicDrawUsage );
        this.meshBufferGeometry.setAttribute( 'position',  positionAttribute);
        this.meshBufferGeometry.setDrawRange( 0, trianglePoints.length);
        this.meshBufferGeometry.computeVertexNormals();
        this.meshBufferGeometry.getAttribute( 'position' ).needsUpdate = true;
        this.meshBufferGeometry.getAttribute( 'normal' ).needsUpdate = true;
    }
}