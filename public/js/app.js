import * as THREE from 'three'
import { OrbitControls } from './libs/jsm/controls/OrbitControls.js'
import { GLTFLoader } from './libs/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from './libs/jsm/loaders/DRACOLoader.js'
import { MeshSurfaceSampler } from './libs/jsm/math/MeshSurfaceSampler.js'
import { mergeGeometries } from './libs/jsm/utils/BufferGeometryUtils.js'

import { Sky } from './libs/jsm/objects/Sky.js'

import GUI from './libs/lil-gui.esm.js'
import gsap from './libs/gsap/index.js'

import tank from '../dirt.glb'
import sunflower from '../sunflower.glb'

export default class Sketch{

    constructor(options){

        this.container = options.dom
        this.width = this.container.offsetWidth
        this.height = this.container.offsetHeight
        this.renderer = new THREE.WebGLRenderer()
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(this.width, this.height)
        this.renderer.setClearColor(0x000000, 1)
        
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

        this.raycaster = new THREE.Raycaster()
        this.pointer = new THREE.Vector2()

        this.container.appendChild(this.renderer.domElement)

        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera( 
            70, 
            window.innerWidth / window.innerHeight, 
            0.001, 
            1000
        )

        this.currentPoint = new THREE.Vector3()
        this.count = 500
        this.ages = new Float32Array( this.count ) // Size of the plant
        this.scales = new Float32Array( this.count ) // If each plant has different scale
        this.growthSpeed = new Float32Array( this.count )
        this.dummy = new THREE.Object3D() 

        this._position = new THREE.Vector3()
        this.positions = []
        this._normal = new THREE.Vector3()
        this.normals = []
        this._scale = new THREE.Vector3()
        
        this.loader = new GLTFLoader()
        
        /* this.dracoLoader = new DRACOLoader()
        this.dracoLoader.setDecoderPath("https://rawcdn.githack.com/mrdoob/three.js/tree/0e054301880a45142dd96b18f520a01a7a76ba10/examples/jsm/libs/draco/gltf")
        this.loader.setDRACOLoader(this.dracoLoader) */

        this.loader.load(tank, (gltf) => {

            this.tank = gltf.scene
            let gms = []
            this.tank.traverse( m => {
                if (m.isMesh) {
                    m.receiveShadow = true
                    m.castShadow = true
                    m.geometry.computeVertexNormals()
                    //m.material = new THREE.MeshStandardMaterial({ wireframe: true, color: 0x00ffff })
                    gms.push(m.geometry)
                }
            })

            let finalGM = mergeGeometries(gms)
            this.finalMesh = new THREE.Mesh(finalGM, new THREE.MeshNormalMaterial())

            this.scene.add( this.tank )

            this.loader.load(sunflower, (gltf) => {
                this.sunflower = gltf.scene.children[0].children[0].children[0]

                this.addObjects()
                this.resize()
                this.render()
                this.setupResize()
                this.addLights()
                this.event()
            })

            
        })

        this.camera.position.set(0, 2, 2)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.time = 0
        this.isPlaying = true

        
        
    }

    event() {
        window.addEventListener( 'click', (event) => {
            this.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1
            this.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1
            this.raycaster.setFromCamera( this.pointer, this.camera )
            this.intersects = this.raycaster.intersectObject( this.finalMesh )
            
            if (this.intersects.length > 0) {
                this.currentPoint = this.intersects[0].point
            }
        })
    }

    addLights() {
        const light1 = new THREE.AmbientLight(0xffffff, 0.3)
        this.scene.add( light1 )

        this.light2 = new THREE.DirectionalLight(0xffffff, 0.8 * Math.PI)
        this.light2.castShadow = true
        this.light2.shadow.camera.near = 0.1
        this.light2.shadow.camera.far = 20
        this.light2.shadow.bias = -0.01
        this.light2.shadow.camera.right = 10
        this.light2.shadow.camera.left = -10
        this.light2.shadow.camera.top = 10
        this.light2.shadow.camera.bottom = -10

        this.light2.shadow.mapSize.width = 2048
        this.light2.shadow.mapSize.height = 2048
        // Set the below position to the position of the light for the lidar scan
        this.light2.position.set(2.8, 3, 0) // ~60 degrees
        this.scene.add( this.light2 )
    }

    addObjects() {
        this.sampler = new MeshSurfaceSampler( this.finalMesh )
        .setWeightAttribute( 'uv' )
        .build()

        // Rotate then scale sunflower
        let s = 0.004
        this.sunflower.rotateX( Math.PI / 2)
        this.sunflower.geometry.scale(s, s, s)

        this.flowers = new THREE.InstancedMesh( 
            this.sunflower.geometry, 
            this.sunflower.material,
            this.count
        )

        this.flowers.receiveShadow = this.flowers.castShadow = true
        for ( let i = 0; i < this.count; i++ ) {
            this.ages[ i ] = 0
            this.scales[ i ] = this.ages[ i ]
            this.growthSpeed[ i ] = 0 

            

            this.positions.push( this._position.clone() )
            this.normals.push( this._normal.clone())
            
            this.sampler.sample( this._position, this._normal )
            this._normal.add( this._position ) // Direction plant should grow

            

            this.dummy.position.copy( this._position )
            this.dummy.scale.set( this.scales[ i ], this.scales[ i ], this.scales[ i ] )
            this.dummy.lookAt( this._normal ) // Orientate the mesh in the direction it should grow
            this.dummy.updateMatrix()

            this.flowers.setMatrixAt( i, this.dummy.matrix )
        }

        this.flowers.instanceMatrix.needsUpdate = true

        this.scene.add( this.flowers )
        
    }


    createGUI() {
        this.gui = new GUI()
    }

    setupResize() {
        window.addEventListener("resize", this.resize.bind(this))
    }

    resize() {
        this.width = this.container.offsetWidth
        this.height = this.container.offsetHeight
        this.renderer.setSize(this.width, this.height)
        this.camera.aspect = this.width / this.height

        this.camera.updateProjectionMatrix()
    }

    rescale(i) {

        this.dummy.position.copy( this.positions[i] )
        let d = this.currentPoint.distanceTo(this.positions[i])

        if (d < 0.1) {
            this.growthSpeed[i] += 0.001
        } else {
            this.growthSpeed[i] *= 0.9
        }

        this.scales[i] += this.growthSpeed[i]
        this.scales[i] = Math.min(1, this.scales[i])

        this.dummy.scale.set( this.scales[i], this.scales[i], this.scales[i] )
        this.dummy.lookAt( this.normals[i] ) // Orientate the mesh in the direction it should grow
        this.dummy.updateMatrix()

        this.flowers.setMatrixAt( i, this.dummy.matrix )
    }

    stop() {
        this.isPlaying = false
    }
    
    play() {
        if (!this.isPlaying) {
            this.isPlaying = true
            this.render()
        }
    }

    render() {
        if (!this.isPlaying) return
        this.time += 0.05
        
        for ( let i = 1; i < this.count; i++ ) {
            this.rescale( i )
        }
        this.flowers.instanceMatrix.needsUpdate = true
        
        this.renderer.render(this.scene, this.camera)
        requestAnimationFrame(this.render.bind(this))
    }
}

new Sketch({
    dom: document.getElementById("container")
})