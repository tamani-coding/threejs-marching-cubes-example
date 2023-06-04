import * as THREE from 'three';
import { EdgeIntersection } from './MarchingCubes2';

export class PointsRenderer {

    pointsBufferGeometry: THREE.BufferGeometry;

    constructor(scene: THREE.Scene) {
        this.pointsBufferGeometry = new THREE.BufferGeometry();
        this.pointsBufferGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [], 3 ) );
        const pointsMaterial = new THREE.PointsMaterial( { color: 0xffffff } );
        const points = new THREE.Points( this.pointsBufferGeometry, pointsMaterial );
        scene.add( points );
    }

    updatePoints(intersectPoints: EdgeIntersection[]) {
        const vertices = [];
        for (const intersectPoint of intersectPoints) {
            const x = intersectPoint.point.x;
            const y = intersectPoint.point.y;
            const z = intersectPoint.point.z;
        
            vertices.push( x, y, z );
        }
        this.pointsBufferGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    }

}

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

    updateMesh(trianglePoints: THREE.Vector3[], vertexIndices: number[]) {
        const vertices = [];
        for (const intersectPoint of trianglePoints) {
            const x = intersectPoint.x;
            const y = intersectPoint.y;
            const z = intersectPoint.z;
        
            vertices.push( x, y, z );
        }

        const attributes = new THREE.Float32BufferAttribute( vertices, 3 );
        attributes.setUsage( THREE.DynamicDrawUsage );
        this.meshBufferGeometry.setAttribute( 'position', attributes );
        this.meshBufferGeometry.setIndex( vertexIndices );
        this.meshBufferGeometry.computeVertexNormals();
    }
}