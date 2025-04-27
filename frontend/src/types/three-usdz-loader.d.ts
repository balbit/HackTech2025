declare module 'three-usdz-loader' {
  import * as THREE from 'three';
  
  export class USDZLoader {
    constructor(basePath: string);
    loadFile(file: File, parent?: THREE.Object3D): Promise<any>;
    clean(): void;
  }
} 