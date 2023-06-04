import * as THREE from 'three';
import { MeshRenderer } from './VolumeRenderers';
import { edgeTable, triTable } from './LookupTables';


export class MetaBall {

    center: THREE.Vector3;
    radius: number;

    constructor(center: THREE.Vector3, radius: number) {
        this.center = center;
        this.radius = radius;
    }

}

export class MarchingCubes {

    scene: THREE.Scene;
    resolution: number;
    scale: number;
    
    metaBalls: MetaBall[] = [];

    isolevel = 0.5;

    meshRenderer: MeshRenderer;

    values: number[] = [];
    points: THREE.Vector3[] = [];

    constructor(scene: THREE.Scene, resolution: number, scale: number, isolevel: number) {
        this.scene = scene;
        this.resolution = resolution;
        this.scale = scale;
        this.isolevel = isolevel;
        this.initGridHelper();

        // generate the list of 3D points
        for (var k = 0; k < resolution; k++)
        for (var j = 0; j < resolution; j++)
        for (var i = 0; i < resolution; i++)
        {
            var x = -(scale/2) + scale * i / (resolution - 1);
            var y = -(scale/2) + scale * j / (resolution - 1);
            var z = -(scale/2) + scale * k / (resolution - 1);
            this.points.push( new THREE.Vector3(x,y,z) );
        }
        // generate values array for points
        const total = resolution * resolution * resolution;
        for (var i = 0; i < total; i++) 
		    this.values[i] = 0;

        // create the triangles renderer
        this.meshRenderer = new MeshRenderer(scene);
    }

    initGridHelper() {
        const gridHelperBottom = new THREE.GridHelper(this.scale, this.resolution);
        gridHelperBottom.position.y = -this.scale / 2;
        const gridHelperLeft = new THREE.GridHelper(this.scale, this.resolution);
        gridHelperLeft.rotation.z = Math.PI / 2;
        gridHelperLeft.position.x = -this.scale / 2;
        const gridHelperBack = new THREE.GridHelper(this.scale, this.resolution);
        gridHelperBack.rotation.x = Math.PI / 2;
        gridHelperBack.position.z = -this.scale / 2;
        this.scene.add(gridHelperBottom);
        this.scene.add(gridHelperLeft);
        this.scene.add(gridHelperBack);
    }

    marchingCubes() {
        // reset all values to 0
        for (let i = 0; i < this.values.length; i++) {
            this.values[i] = 0;
        }
        // add values using the metaball approximation function
        for (const metaBall of this.metaBalls) {
            for (let i = 0; i < this.points.length; i++) {
                // meta ball function
                const distance = metaBall.radius - metaBall.center.distanceTo(this.points[i]);
                this.values[i] += Math.exp(- (distance * distance) );
            }
        }

        // list containing intersection points
        var vlist = new Array(12);

        const resolution2 = this.resolution * this.resolution;

        let trianglePoints: THREE.Vector3[] = [];

        for (var z = 0; z < this.resolution - 1; z++)
        for (var y = 0; y < this.resolution - 1; y++)
        for (var x = 0; x < this.resolution - 1; x++)
        {
            // indexes of points in the cube
            var p    = x + this.resolution * y + resolution2 * z,
            px   = p   + 1,
            py   = p   + this.resolution,
            pxy  = py  + 1,
            pz   = p   + resolution2,
            pxz  = px  + resolution2,
            pyz  = py  + resolution2,
            pxyz = pxy + resolution2;

            // store scalar values corresponding to vertices
            var value0 = this.values[ p    ],
                value1 = this.values[ px   ],
                value2 = this.values[ py   ],
                value3 = this.values[ pxy  ],
                value4 = this.values[ pz   ],
                value5 = this.values[ pxz  ],
                value6 = this.values[ pyz  ],
                value7 = this.values[ pxyz ];

            // place a "1" in bit positions corresponding to vertices whose
		    //   isovalue is less than given constant.
            var cubeindex = 0;
            if ( value0 < this.isolevel ) cubeindex |= 1;
            if ( value1 < this.isolevel ) cubeindex |= 2;
            if ( value2 < this.isolevel ) cubeindex |= 8;
            if ( value3 < this.isolevel ) cubeindex |= 4;
            if ( value4 < this.isolevel ) cubeindex |= 16;
            if ( value5 < this.isolevel ) cubeindex |= 32;
            if ( value6 < this.isolevel ) cubeindex |= 128;
            if ( value7 < this.isolevel ) cubeindex |= 64;

            var cubeindex = 0;
            if ( value0 < this.isolevel ) cubeindex |= 1;
            if ( value1 < this.isolevel ) cubeindex |= 2;
            if ( value2 < this.isolevel ) cubeindex |= 8;
            if ( value3 < this.isolevel ) cubeindex |= 4;
            if ( value4 < this.isolevel ) cubeindex |= 16;
            if ( value5 < this.isolevel ) cubeindex |= 32;
            if ( value6 < this.isolevel ) cubeindex |= 128;
            if ( value7 < this.isolevel ) cubeindex |= 64;

            // bits = 12 bit number, indicates which edges are crossed by the isosurface
            var bits = edgeTable[ cubeindex ];

            // if none are crossed, proceed to next iteration
            if ( bits === 0 ) continue;

            // check which edges are crossed, and estimate the point location
            //    using a weighted average of scalar values at edge endpoints.
            // store the vertex in an array for use later.
            var mu = 0.5;

            // bottom of the cube
            if ( bits & 1 )
            {		
                mu = ( this.isolevel - value0 ) / ( value1 - value0 );
                vlist[0] = this.points[p].clone().lerp( this.points[px], mu );
            }
            if ( bits & 2 )
            {
                mu = ( this.isolevel - value1 ) / ( value3 - value1 );
                vlist[1] = this.points[px].clone().lerp( this.points[pxy], mu );
            }
            if ( bits & 4 )
            {
                mu = ( this.isolevel - value2 ) / ( value3 - value2 );
                vlist[2] = this.points[py].clone().lerp( this.points[pxy], mu );
            }
            if ( bits & 8 )
            {
                mu = ( this.isolevel - value0 ) / ( value2 - value0 );
                vlist[3] = this.points[p].clone().lerp( this.points[py], mu );
            }
            // top of the cube
            if ( bits & 16 )
            {
                mu = ( this.isolevel - value4 ) / ( value5 - value4 );
                vlist[4] = this.points[pz].clone().lerp( this.points[pxz], mu );
            }
            if ( bits & 32 )
            {
                mu = ( this.isolevel - value5 ) / ( value7 - value5 );
                vlist[5] = this.points[pxz].clone().lerp( this.points[pxyz], mu );
            }
            if ( bits & 64 )
            {
                mu = ( this.isolevel - value6 ) / ( value7 - value6 );
                vlist[6] = this.points[pyz].clone().lerp( this.points[pxyz], mu );
            }
            if ( bits & 128 )
            {
                mu = ( this.isolevel - value4 ) / ( value6 - value4 );
                vlist[7] = this.points[pz].clone().lerp( this.points[pyz], mu );
            }
            // vertical lines of the cube
            if ( bits & 256 )
            {
                mu = ( this.isolevel - value0 ) / ( value4 - value0 );
                vlist[8] = this.points[p].clone().lerp( this.points[pz], mu );
            }
            if ( bits & 512 )
            {
                mu = ( this.isolevel - value1 ) / ( value5 - value1 );
                vlist[9] = this.points[px].clone().lerp( this.points[pxz], mu );
            }
            if ( bits & 1024 )
            {
                mu = ( this.isolevel - value3 ) / ( value7 - value3 );
                vlist[10] = this.points[pxy].clone().lerp( this.points[pxyz], mu );
            }
            if ( bits & 2048 )
            {
                mu = ( this.isolevel - value2 ) / ( value6 - value2 );
                vlist[11] = this.points[py].clone().lerp( this.points[pyz], mu );
            }

            // construct triangles -- get correct vertices from triTable.
            var i = 0;
            cubeindex <<= 4;  // multiply by 16... 
            // "Re-purpose cubeindex into an offset into triTable." 
            //  since each row really isn't a row.

            // the while loop should run at most 5 times,
            //   since the 16th entry in each row is a -1.
            while ( triTable[ cubeindex + i ] != -1 ) 
            {
                var index1 = triTable[cubeindex + i];
                var index2 = triTable[cubeindex + i + 1];
                var index3 = triTable[cubeindex + i + 2];
                
                trianglePoints.push( vlist[index1].clone() );
                trianglePoints.push( vlist[index2].clone() );
                trianglePoints.push( vlist[index3].clone() );

                i += 3;
            }
        }

        this.meshRenderer.updateMesh(trianglePoints);
    }
}
