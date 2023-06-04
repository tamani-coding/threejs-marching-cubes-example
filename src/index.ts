import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'dat.gui';
import { MarchingCubes, MetaBall } from './MarchingCubes';

let container;

		let camera, scene, renderer;

		let light, pointLight, ambientLight;

		let effectController;

		let time = 0;

		let marchingCubes;
		const metaball1 = new MetaBall(new THREE.Vector3(-3, 1, 0), 0.2);
		const metaball2 = new MetaBall(new THREE.Vector3(2, 0, 0), 0.5);
		const metaball3 = new MetaBall(new THREE.Vector3(2, 0, -2), 0.25);

		const clock = new THREE.Clock();

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

			// LIGHTS

			light = new THREE.DirectionalLight( 0xB70404 );
			light.position.set( 0.5, 0.5, 1 );
			scene.add( light );

			pointLight = new THREE.PointLight( 0xF79327 );
			pointLight.position.set( 0, 0, 100 );
			scene.add( pointLight );

			ambientLight = new THREE.AmbientLight( 0x323232 );
			scene.add( ambientLight );

			// MARCHING CUBES
			marchingCubes = new MarchingCubes(scene, 30, 10, 0.5);
			marchingCubes.metaBalls.push(metaball1);
			marchingCubes.metaBalls.push(metaball2);
			marchingCubes.metaBalls.push(metaball3);

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

			metaball2.center.x = Math.sin(time) * 2;
			metaball2.center.y = Math.cos(time) * 2;

			// marching cubes 2
			marchingCubes.marchingCubes();

			renderer.render( scene, camera );

		}