import * as THREE from 'three';
import { MeshRenderer, PointsRenderer } from './VolumeRenderers';
import { edgeTable, triTable } from './LookupTables';

export class Cube {

    position: THREE.Vector3;
    size: number;
    vertices: THREE.Vector3[] = [];
    values: number[] = [0,0,0,0,0,0,0,0];

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

    vertexInterp(index0: number, index1: number, isolevel: number): THREE.Vector3 {
        const mu = (isolevel - this.values[index0]) / (this.values[index1] - this.values[index0]);
        return this.vertices[index0].clone().lerp(this.vertices[index1], mu);
    }
}

export class EdgeIntersection {

    point: THREE.Vector3;

    constructor(point: THREE.Vector3) {
        this.point = point;
    }

}

export class MetaBall {

    center: THREE.Vector3;
    radius: number;

    constructor(center: THREE.Vector3, radius: number) {
        this.center = center;
        this.radius = radius;
    }

}

export class MarchingCubes2 {

    scene: THREE.Scene;
    resolutions: number;
    scale: number;
    
    cubes: Cube[] = [];
    metaBalls: MetaBall[] = [];

    isolevel = 0.5;

    pointsMeshRenderer: PointsRenderer;
    meshRenderer: MeshRenderer;

    constructor(scene: THREE.Scene, resolutions: number, scale: number, isolevel: number) {
        this.scene = scene;
        this.resolutions = resolutions;
        this.scale = scale;
        this.isolevel = isolevel;
        this.initCubes();
        this.initGridHelper();

        this.pointsMeshRenderer = new PointsRenderer(scene);
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

    cubeIndex(cube: Cube): number {
        let cubeIndex = 0;

        if (cube.values[0] < this.isolevel) cubeIndex |= 1;
        if (cube.values[1] < this.isolevel) cubeIndex |= 2;
        if (cube.values[2] < this.isolevel) cubeIndex |= 4;
        if (cube.values[3] < this.isolevel) cubeIndex |= 8;
        if (cube.values[4] < this.isolevel) cubeIndex |= 16;
        if (cube.values[5] < this.isolevel) cubeIndex |= 32;
        if (cube.values[6] < this.isolevel) cubeIndex |= 64;
        if (cube.values[7] < this.isolevel) cubeIndex |= 128;

        return cubeIndex;
    }

    intersectionPoints(cube: Cube, edges: number): Map<number,EdgeIntersection> {
        // map of edge index to intersection point
        const points: Map<number,EdgeIntersection> = new Map<number,EdgeIntersection>();

        // bottom part of cube
        if (edges & 1) {
            points.set(0, new EdgeIntersection(cube.vertexInterp(0, 1, this.isolevel)));
        }
        if (edges & 2) {
            points.set(1, new EdgeIntersection(cube.vertexInterp(1, 2, this.isolevel)));
        }
        if (edges & 4) {
            points.set(2, new EdgeIntersection(cube.vertexInterp(2, 3, this.isolevel)));
        }
        if (edges & 8) {
            points.set(3, new EdgeIntersection(cube.vertexInterp(3, 0, this.isolevel)));
        }

        // top part of cube
        if (edges & 16) {
            points.set(4, new EdgeIntersection(cube.vertexInterp(4, 5, this.isolevel)));
        }
        if (edges & 32) {
            points.set(5, new EdgeIntersection(cube.vertexInterp(5, 6, this.isolevel)));
        }
        if (edges & 64) {
            points.set(6, new EdgeIntersection(cube.vertexInterp(6, 7, this.isolevel)));
        }
        if (edges & 128) {
            points.set(7, new EdgeIntersection(cube.vertexInterp(7, 4, this.isolevel)));
        }

        // vertical lines
        if (edges & 256) {
            points.set(8, new EdgeIntersection(cube.vertexInterp(0, 4, this.isolevel)));
        }
        if (edges & 512) {
            points.set(9, new EdgeIntersection(cube.vertexInterp(1, 5, this.isolevel)));
        }
        if (edges & 1024) {
            points.set(10, new EdgeIntersection(cube.vertexInterp(2, 6, this.isolevel)));
        }
        if (edges & 2048) {
            points.set(11, new EdgeIntersection(cube.vertexInterp(3, 7, this.isolevel)));
        }

        return points;
    }

    addBallValues(center: THREE.Vector3, radius: number) {
        for (const cube of this.cubes) {
            let i = 0;
            while (i < 8) {
                const distance = radius - center.distanceTo(cube.vertices[i]);
                cube.values[i] += Math.exp(- (distance * distance) );
                i++;
            }
        }
    }

    cleanValues() {
        for (const cube of this.cubes) {
            for (let i = 0; i < 8; i++) {
                cube.values[i] = 0;
            }
        }
    }

    updateAndRender(delta: number) {
        this.cleanValues();
        for(const metaBall of this.metaBalls) {
            this.addBallValues(metaBall.center, metaBall.radius);
        }

        let intersectPoints: EdgeIntersection[] = [];
        let trianglePoints: THREE.Vector3[] = [];
        let vertexIndices: number[] = [];
        let vertexIndex = 0;

        for(const cube of this.cubes) {
            let cubeIndex = this.cubeIndex(cube);
            if (cubeIndex > 0 && cubeIndex < 255) {
                // edges is a bitfield indicating which edges are crossed by the volume
                const edges = edgeTable[cubeIndex];
                // determine which edges are intersected by the volume and the intersection points
                const intersectionPointsMap = this.intersectionPoints(cube, edges);
                intersectPoints = intersectPoints.concat( Array.from(intersectionPointsMap.values()) );

                // determine the triangles to render using triTable
                cubeIndex <<= 4; // re-purpose cubeindex into an offset into triTable
                let i = 0;
                while( triTable[cubeIndex + i] != -1) {
                    const i1 = triTable[cubeIndex + i];
                    const i2 = triTable[cubeIndex + i + 1];
                    const i3 = triTable[cubeIndex + i + 2];

                    trianglePoints.push(intersectionPointsMap.get(i3).point);
                    trianglePoints.push(intersectionPointsMap.get(i2).point);
                    trianglePoints.push(intersectionPointsMap.get(i1).point);

                    vertexIndices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                    vertexIndex += 3;
                    i += 3;
                }
                
            }
        }

        // this.pointsMeshRenderer.updatePoints(intersectPoints);
        this.meshRenderer.updateMesh(trianglePoints, vertexIndices);
    }
}
