import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'dat.gui';
import { marchingCubes, metaBalls } from './MarchingCubes';

let container;

		let camera, scene, renderer;

		let light, pointLight, ambientLight;

		let effectController;

		let time = 0;

		const clock = new THREE.Clock();

		// BUFFER GEOMETRY

		const maxPolygons = 30000;
		const vertices = Array(3 * maxPolygons).fill(0);

		const meshBufferGeometry = new THREE.BufferGeometry();
		const buffer = new THREE.Float32BufferAttribute( vertices, 3 );
		buffer.setUsage( THREE.DynamicDrawUsage );
		meshBufferGeometry.setAttribute( 'position', buffer );

		const mesh = new THREE.Mesh( meshBufferGeometry, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
		mesh.castShadow = true;
		mesh.receiveShadow = true;

		function updateMesh(trianglePoints: THREE.Vector3[]) {
			for (let i = 0; i < trianglePoints.length; i++) {
				const x = trianglePoints[i].x;
				const y = trianglePoints[i].y;
				const z = trianglePoints[i].z;
			
				vertices[i * 3    ] = x;
				vertices[i * 3 + 1] = y;
				vertices[i * 3 + 2] = z;
			}
			const positionAttribute = new THREE.Float32BufferAttribute( vertices, 3 );
			positionAttribute.setUsage( THREE.DynamicDrawUsage );
			meshBufferGeometry.setAttribute( 'position',  positionAttribute);
			meshBufferGeometry.setDrawRange( 0, trianglePoints.length);
			meshBufferGeometry.computeVertexNormals();
			meshBufferGeometry.getAttribute( 'position' ).needsUpdate = true;
			meshBufferGeometry.getAttribute( 'normal' ).needsUpdate = true;
		}

		init();
		animate();

		function init() {

			container = document.getElementById( 'container' );

			// CAMERA

			camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
			camera.position.set( 0, 5, 10 );

			// SCENE

			scene = new THREE.Scene();
			scene.background = new THREE.Color( 0x4F709C );

			scene.add( mesh );

			// LIGHTS

			light = new THREE.DirectionalLight( 0xB70404 );
			light.position.set( 0.5, 0.5, 1 );
			scene.add( light );

			pointLight = new THREE.PointLight( 0xF79327 );
			pointLight.position.set( 0, 0, 100 );
			scene.add( pointLight );

			ambientLight = new THREE.AmbientLight( 0x323232 );
			scene.add( ambientLight );

			// RENDERER

			renderer = new THREE.WebGLRenderer();
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( window.innerWidth, window.innerHeight );
			container.appendChild( renderer.domElement );

			// CONTROLS

			const controls = new OrbitControls( camera, renderer.domElement );
			controls.minDistance = 1.5;
			controls.maxDistance = 40;

			// GUI

			setupGui();

			// EVENTS

			window.addEventListener( 'resize', onWindowResize );

		}

		//

		function onWindowResize() {

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();

			renderer.setSize( window.innerWidth, window.innerHeight );

		}

		//

		function setupGui() {


			effectController = {

				speed: 2.0,

				dummy: function () {}

			};

			let h;

			const gui = new GUI();

			// simulation

			h = gui.addFolder( 'Simulation' );

			h.add( effectController, 'speed', 0.1, 8.0, 0.05 );

		}

		//

		function animate() {

			requestAnimationFrame( animate );

			render();

		}

		function render() {

			const delta = clock.getDelta();

			time += delta * effectController.speed * 0.5;

			metaBalls[1].center.x = Math.sin(time) * 2;
			metaBalls[1].center.y = Math.cos(time) * 2;

			// marching cubes 2
			const triangles = marchingCubes();
			updateMesh(triangles);

			renderer.render( scene, camera );

		}