'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { USDZLoader } from 'three-usdz-loader';

interface ThreeJSViewerProps {
  modelUrl: string;
}

const ThreeJSViewer: React.FC<ThreeJSViewerProps> = ({ modelUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<any>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef<boolean>(false);

  // Cleanup function to ensure proper disposal of Three.js resources
  const cleanup = () => {
    // Cancel any ongoing animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clean up the model if it exists
    if (modelRef.current && modelRef.current.clean) {
      modelRef.current.clean();
      modelRef.current = null;
    }
    
    // Dispose controls
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }
    
    // Dispose renderer and remove canvas
    if (rendererRef.current) {
      // Remove the canvas from DOM
      if (rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
      
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    
    // Clear scene
    if (sceneRef.current) {
      // Dispose all geometries and materials to prevent memory leaks
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      
      sceneRef.current = null;
    }
    
    // Clear camera reference
    cameraRef.current = null;
  };

  // Initialize Three.js scene
  useEffect(() => {
    // Prevent double initialization
    if (mountedRef.current && rendererRef.current) {
      cleanup();
    }
    
    mountedRef.current = true;
    
    if (!containerRef.current) return;

    // Ensure container is empty before creating new canvas
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Dimensions
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5); // Light gray background
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 2); // Position the camera a bit further back
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 0.5;
    controls.maxDistance = 4;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    
    // Lights (more lights for better visibility without environment map)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, 0.5, -1);
    scene.add(directionalLight2);

    // Add a simple ground grid for better orientation
    const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // Group to hold the model
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Try to load the model with the new loader
    const loadModel = async () => {
      console.log("Attempting to load model from:", modelUrl);
      setIsLoading(true);
      
      try {
        // Initialize the new USDZ loader with the path to the external dependencies
        const loader = new USDZLoader('/external/');
        
        // Fetch the model as a blob
        const response = await fetch(modelUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch USDZ file: ${response.status}`);
        }
        
        // Convert response to File object for the loader
        const blob = await response.blob();
        const file = new File([blob], 'model.usdz', { type: 'model/vnd.usdz+zip' });
        
        // Load the file
        const loadedModel = await loader.loadFile(file, modelGroup);
        
        // Store the loaded model reference for cleanup
        modelRef.current = loadedModel;
        
        // Auto-center the model
        const box = new THREE.Box3().setFromObject(modelGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Adjust model position to center it
        modelGroup.position.x = -center.x;
        modelGroup.position.y = -center.y + (size.y / 2); // Place on grid
        modelGroup.position.z = -center.z;
        
        // Adjust camera position based on model size
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.z = maxDim * 2.5;
        
        // Update controls to focus on the model
        controls.target.set(0, size.y / 2, 0);
        controls.update();
        
        setIsLoading(false);
        setLoadError(null);
      } catch (error) {
        console.error("Error loading USDZ model:", error);
        setLoadError(`Failed to load 3D model: ${error instanceof Error ? error.message : 'Unknown error'}`);
        createPlaceholderModel();
      }
    };
    
    // Create a placeholder model when loading fails
    const createPlaceholderModel = () => {
      // Create a group to hold our placeholder objects
      const group = new THREE.Group();
      
      // Add some basic geometric shapes
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x3080ff, 
        roughness: 0.5, 
        metalness: 0.2 
      });
      
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 0.5, 0); // Place it on the grid
      group.add(cube);
      
      // Add a sphere
      const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const sphereMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff4040, 
        roughness: 0.3, 
        metalness: 0.2 
      });
      
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(0, 1.5, 0); // Place it on top of the cube
      group.add(sphere);
      
      // Add the placeholder to the scene
      scene.add(group);
      
      // Display an informative error
      setLoadError("Unable to load the 3D model format. Showing a placeholder instead.");
      setIsLoading(false);
    };
    
    // Start loading the model
    loadModel();

    // Animation loop
    const animate = () => {
      // Store the animation frame ID for cleanup
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      
      // Update controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    
    // Start animation loop
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    // Return cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
    };
  }, [modelUrl]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      if (mountedRef.current) {
        cleanup();
        mountedRef.current = false;
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col relative">
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-md overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 flex-1"
        style={{ minHeight: '400px' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <div className="text-blue-600 font-medium">Loading 3D model...</div>
        </div>
      )}
      
      {loadError && (
        <div className="absolute bottom-2 left-2 right-2 p-2 bg-red-50 text-red-600 text-sm rounded z-10">
          {loadError}
        </div>
      )}
    </div>
  );
};

export default ThreeJSViewer; 