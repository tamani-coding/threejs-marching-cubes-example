import * as THREE from 'three';
import { Volume } from './Volumes';
import { MeshRenderer, PointsMeshRenderer } from './VolumeRenderers';
import { edgeTable, triTable } from './MarchingCubes';

export class Cube {

    position: THREE.Vector3;
    size: number;
    vertices: THREE.Vector3[] = [];

    constructor(position: THREE.Vector3, size: number) {
        this.position = position;
        this.size = size;
        this.initVertices();
    }

    initVertices() {
        const halfSize = this.size / 2;
        const vertices = [
            new THREE.Vector3(-halfSize, -halfSize, -halfSize).add(this.position), // 0
            new THREE.Vector3(halfSize, -halfSize, -halfSize).add(this.position), // 1
            new THREE.Vector3(halfSize, -halfSize, halfSize).add(this.position), // 2
            new THREE.Vector3(-halfSize, -halfSize, halfSize).add(this.position), // 3
            new THREE.Vector3(-halfSize, halfSize, -halfSize).add(this.position), // 4
            new THREE.Vector3(halfSize, halfSize, -halfSize).add(this.position), // 5
            new THREE.Vector3(halfSize, halfSize, halfSize).add(this.position), // 6
            new THREE.Vector3(-halfSize, halfSize, halfSize).add(this.position), // 7
        ];
        this.vertices.push(...vertices);
    }

    vertexInterp(index0: number, index1: number, volume: Volume): THREE.Vector3 {
        const v0 = this.vertices[index0];
        const v1 = this.vertices[index1];
        
        return volume.intersectionPoint(v0, v1);
        
        // const result = new THREE.Vector3();
        // const tmp = v1.clone().sub(v0).multiplyScalar(0.5);
        // return result.copy(v0).add(tmp);
    }
}

export class EdgeIntersection {

    point: THREE.Vector3;

    constructor(point: THREE.Vector3) {
        this.point = point;
    }

}

export class MarchingCubes2 {

    scene: THREE.Scene;
    resolutions: number;
    scale: number;
    
    cubes: Cube[] = [];
    volumes: Volume[] = [];

    pointsMeshRenderer: PointsMeshRenderer;
    meshRenderer: MeshRenderer;

    constructor(scene: THREE.Scene, resolutions: number, scale: number) {
        this.scene = scene;
        this.resolutions = resolutions;
        this.scale = scale;
        this.initCubes();
        this.initGridHelper();

        this.pointsMeshRenderer = new PointsMeshRenderer(scene);
        this.meshRenderer = new MeshRenderer(scene);
    }

    initCubes() {
        const max = this.resolutions * this.resolutions * this.resolutions;
        const size = 1 / this.resolutions * this.scale;
        for (let i = 0; i < max; i++) {
            const position = new THREE.Vector3(
                (i % this.resolutions) * size - this.scale / 2 + size / 2, 
                Math.floor(i / this.resolutions) % this.resolutions * size - this.scale / 2 + size / 2, 
                Math.floor(i / this.resolutions / this.resolutions) * size - this.scale / 2 + size / 2);
            this.cubes.push(new Cube(position, size));
        }
    }

    initGridHelper() {
        const gridHelperBottom = new THREE.GridHelper(this.scale, this.resolutions);
        gridHelperBottom.position.y = -this.scale / 2;
        const gridHelperLeft = new THREE.GridHelper(this.scale, this.resolutions);
        gridHelperLeft.rotation.z = Math.PI / 2;
        gridHelperLeft.position.x = -this.scale / 2;
        const gridHelperBack = new THREE.GridHelper(this.scale, this.resolutions);
        gridHelperBack.rotation.x = Math.PI / 2;
        gridHelperBack.position.z = -this.scale / 2;
        this.scene.add(gridHelperBottom);
        this.scene.add(gridHelperLeft);
        this.scene.add(gridHelperBack);
    }

    addVolume(volume: Volume) {   
        this.volumes.push(volume);
    }

    cubeIndex(cube: Cube, volume: Volume): number {
        let cubeIndex = 0;

        if (volume.isPointWithin(cube.vertices[0])) cubeIndex |= 1;
        if (volume.isPointWithin(cube.vertices[1])) cubeIndex |= 2;
        if (volume.isPointWithin(cube.vertices[2])) cubeIndex |= 4;
        if (volume.isPointWithin(cube.vertices[3])) cubeIndex |= 8;
        if (volume.isPointWithin(cube.vertices[4])) cubeIndex |= 16;
        if (volume.isPointWithin(cube.vertices[5])) cubeIndex |= 32;
        if (volume.isPointWithin(cube.vertices[6])) cubeIndex |= 64;
        if (volume.isPointWithin(cube.vertices[7])) cubeIndex |= 128;

        return cubeIndex;
    }

    intersectionPoints(cube: Cube, edges: number, volume: Volume): Map<number,EdgeIntersection> {
        // map of edge index to intersection point
        const points: Map<number,EdgeIntersection> = new Map<number,EdgeIntersection>();

        // bottom part of cube
        if (edges & 1) {
            points.set(0, new EdgeIntersection(cube.vertexInterp(0, 1, volume)));
        }
        if (edges & 2) {
            points.set(1, new EdgeIntersection(cube.vertexInterp(1, 2, volume)));
        }
        if (edges & 4) {
            points.set(2, new EdgeIntersection(cube.vertexInterp(2, 3, volume)));
        }
        if (edges & 8) {
            points.set(3, new EdgeIntersection(cube.vertexInterp(3, 0, volume)));
        }

        // top part of cube
        if (edges & 16) {
            points.set(4, new EdgeIntersection(cube.vertexInterp(4, 5, volume)));
        }
        if (edges & 32) {
            points.set(5, new EdgeIntersection(cube.vertexInterp(5, 6, volume)));
        }
        if (edges & 64) {
            points.set(6, new EdgeIntersection(cube.vertexInterp(6, 7, volume)));
        }
        if (edges & 128) {
            points.set(7, new EdgeIntersection(cube.vertexInterp(7, 4, volume)));
        }

        // vertical lines
        if (edges & 256) {
            points.set(8, new EdgeIntersection(cube.vertexInterp(0, 4, volume)));
        }
        if (edges & 512) {
            points.set(9, new EdgeIntersection(cube.vertexInterp(1, 5, volume)));
        }
        if (edges & 1024) {
            points.set(10, new EdgeIntersection(cube.vertexInterp(2, 6, volume)));
        }
        if (edges & 2048) {
            points.set(11, new EdgeIntersection(cube.vertexInterp(3, 7, volume)));
        }

        return points;
    }

    updateAndRender(delta: number) {
        let intersectPoints: EdgeIntersection[] = [];
        let trianglePoints: THREE.Vector3[] = [];

        for(const cube of this.cubes) {
            for(const volume of this.volumes) {
                // determine which cube vertices are within the volume
                let cubeIndex = this.cubeIndex(cube, volume);
                if (cubeIndex > 0) {
                    // edges is a bitfield indicating which edges are crossed by the volume
                    const edges = edgeTable[cubeIndex];
                    // determine which edges are intersected by the volume and the intersection points
                    const intersectionPointsMap = this.intersectionPoints(cube, edges, volume);
                    intersectPoints = intersectPoints.concat( Array.from(intersectionPointsMap.values()) );

                    // determine the triangles to render using triTable
                    cubeIndex <<= 4; // re-purpose cubeindex into an offset into triTable
                    let i = 0;
                    let edgeIndex = 0;
                    while( ( edgeIndex = triTable[cubeIndex + i] ) != -1) {
                        const intersectPoint = intersectionPointsMap.get(edgeIndex);
                        if (intersectPoint) {
                            trianglePoints.push(intersectPoint.point);
                        }
                        i++;
                    }
                    
                }
            }
        }

        this.pointsMeshRenderer.updatePoints(intersectPoints);
        this.meshRenderer.updateMesh(trianglePoints);
    }
}
