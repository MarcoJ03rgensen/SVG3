/**
 * SVG3 Game Character Example
 * Shows how to use game controls for a 3D character in a game
 */

import {
  SVG3Parser,
  SVG3ThreeRenderer,
  enableGameControls,
  GameCharacter,
} from './svg3-complete.js';

// ============================================================================
// GAME CHARACTER SETUP
// ============================================================================

const characterSVG3 = `<?xml version="1.0" encoding="UTF-8"?>
<svg3 version="1.0" xmlns="http://www.w3.org/2024/svg3" viewBox="0 0 1920 1080">
  <metadata>
    <creator>SVG3 Game Character</creator>
  </metadata>

  <defs>
    <!-- Head -->
    <geometry id="head-geom" type="sphere" radius="0.4" widthSegments="16" heightSegments="16" />
    
    <!-- Torso -->
    <geometry id="torso-geom" type="box" width="0.6" height="1" depth="0.4" />
    
    <!-- Limbs -->
    <geometry id="limb-geom" type="cylinder" radiusTop="0.15" radiusBottom="0.15" height="0.8" radialSegments="8" heightSegments="1" />
    
    <!-- Hands/Feet -->
    <geometry id="hand-geom" type="sphere" radius="0.15" widthSegments="8" heightSegments="8" />

    <!-- Materials -->
    <material id="skin" type="standard" color="#f4a460" metalness="0.1" roughness="0.7" />
    <material id="torso-mat" type="standard" color="#2c3e50" metalness="0.2" roughness="0.6" />
    <material id="limb-mat" type="standard" color="#34495e" metalness="0.15" roughness="0.65" />
  </defs>

  <scene id="character-scene" camera="cam1" ambientLight="0.6">
    <camera id="cam1" type="perspective" fov="75" aspect="16/9" near="0.1" far="1000" position="0,0.5,3" />
    
    <light type="directional" intensity="0.8" color="#ffffff" position="3,3,3" />
    <light type="point" intensity="0.4" color="#32b8c6" position="-2,1,2" />

    <group id="character-root" position="0,0,0" rotation="0,0,0" scale="1,1,1">
      
      <!-- TORSO (root bone) -->
      <mesh id="torso" 
            geometry="torso-geom" 
            material="torso-mat" 
            position="0,0,0" 
            rotation="0,0,0" 
            scale="1,1,1" 
            castShadow="true" />

      <!-- HEAD (child of torso) -->
      <mesh id="head" 
            geometry="head-geom" 
            material="skin" 
            position="0,0.7,0" 
            rotation="0,0,0" 
            scale="1,1,1" 
            castShadow="true" />

      <!-- LEFT ARM -->
      <group id="left-arm-group" position="0.35,0.3,0" rotation="0,0,0">
        <mesh id="left-arm" 
              geometry="limb-geom" 
              material="limb-mat" 
              position="0,0,0" 
              rotation="0,0,-0.3" 
              scale="1,1,1" 
              castShadow="true" />
        
        <!-- Left Hand (child of arm) -->
        <mesh id="left-hand" 
              geometry="hand-geom" 
              material="skin" 
              position="0,-0.5,0" 
              rotation="0,0,0" 
              scale="1,1,1" 
              castShadow="true" />
      </group>

      <!-- RIGHT ARM -->
      <group id="right-arm-group" position="-0.35,0.3,0" rotation="0,0,0">
        <mesh id="right-arm" 
              geometry="limb-geom" 
              material="limb-mat" 
              position="0,0,0" 
              rotation="0,0,0.3" 
              scale="1,1,1" 
              castShadow="true" />
        
        <!-- Right Hand (child of arm) -->
        <mesh id="right-hand" 
              geometry="hand-geom" 
              material="skin" 
              position="0,-0.5,0" 
              rotation="0,0,0" 
              scale="1,1,1" 
              castShadow="true" />
      </group>

      <!-- LEFT LEG -->
      <group id="left-leg-group" position="0.2,-0.5,0" rotation="0,0,0">
        <mesh id="left-leg" 
              geometry="limb-geom" 
              material="limb-mat" 
              position="0,0,0" 
              rotation="0,0,0" 
              scale="1,1,1" 
              castShadow="true" />
        
        <!-- Left Foot (child of leg) -->
        <mesh id="left-foot" 
              geometry="hand-geom" 
              material="skin" 
              position="0,-0.5,0" 
              rotation="0,0,0" 
              scale="1,1,1" 
              castShadow="true" />
      </group>

      <!-- RIGHT LEG -->
      <group id="right-leg-group" position="-0.2,-0.5,0" rotation="0,0,0">
        <mesh id="right-leg" 
              geometry="limb-geom" 
              material="limb-mat" 
              position="0,0,0" 
              rotation="0,0,0" 
              scale="1,1,1" 
              castShadow="true" />
        
        <!-- Right Foot (child of leg) -->
        <mesh id="right-foot" 
              geometry="hand-geom" 
              material="skin" 
              position="0,-0.5,0" 
              rotation="0,0,0" 
              scale="1,1,1" 
              castShadow="true" />
      </group>

    </group>
  </scene>
</svg3>`;

// ============================================================================
// GAME EXAMPLE
// ============================================================================

async function setupGameCharacter(canvas) {
  // Parse SVG3
  const parser = new SVG3Parser();
  const sceneData = parser.parse(characterSVG3);

  // Create Three.js renderer
  const renderer = new SVG3ThreeRenderer(sceneData, canvas);
  await renderer.init();

  // Enable game controls
  const gameController = enableGameControls(renderer);

  // Define character skeleton
  const characterBones = [
    { id: 'torso', parent: null, position: [0, 0, 0] },
    { id: 'head', parent: 'torso', position: [0, 0.7, 0] },
    { id: 'left-arm', parent: 'torso', position: [0.35, 0.3, 0] },
    { id: 'left-hand', parent: 'left-arm', position: [0, -0.5, 0] },
    { id: 'right-arm', parent: 'torso', position: [-0.35, 0.3, 0] },
    { id: 'right-hand', parent: 'right-arm', position: [0, -0.5, 0] },
    { id: 'left-leg', parent: 'torso', position: [0.2, -0.5, 0] },
    { id: 'left-foot', parent: 'left-leg', position: [0, -0.5, 0] },
    { id: 'right-leg', parent: 'torso', position: [-0.2, -0.5, 0] },
    { id: 'right-foot', parent: 'right-leg', position: [0, -0.5, 0] },
  ];

  // Create character
  const character = new GameCharacter('Player', gameController, characterBones);

  // Setup IK for arms
  character.setupIK('left-arm', 'left-arm', 'left-hand');
  character.setupIK('right-arm', 'right-arm', 'right-hand');

  // Setup state machine for character animations
  character.stateMachine.addState('idle', (gc, dt) => {
    // Gentle head tilt
    const head = gc.getBone('head');
    if (head) {
      head.mesh.rotation.y = Math.sin(Date.now() / 3000) * 0.2;
    }
  });

  character.stateMachine.addState('walking', (gc, dt) => {
    // Leg swinging animation
    const leftLeg = gc.getBone('left-leg');
    const rightLeg = gc.getBone('right-leg');
    const time = Date.now() / 500;

    if (leftLeg && rightLeg) {
      leftLeg.mesh.rotation.x = Math.sin(time) * 0.3;
      rightLeg.mesh.rotation.x = Math.sin(time + Math.PI) * 0.3;
    }

    // Arm swinging
    const leftArm = gc.getBone('left-arm');
    const rightArm = gc.getBone('right-arm');
    if (leftArm && rightArm) {
      leftArm.mesh.rotation.x = Math.sin(time + Math.PI) * 0.2;
      rightArm.mesh.rotation.x = Math.sin(time) * 0.2;
    }
  });

  character.stateMachine.addState('attacking', (gc, dt) => {
    // Swing right arm
    const rightArm = gc.getBone('right-arm');
    if (rightArm) {
      rightArm.mesh.rotation.z = Math.sin(Date.now() / 300) * 1;
    }
  });

  // Transitions
  character.stateMachine.addTransition('idle', 'walking', 
    (gc, params) => params.isMoving === true);
  character.stateMachine.addTransition('walking', 'idle', 
    (gc, params) => params.isMoving === false);
  character.stateMachine.addTransition('idle', 'attacking', 
    (gc, params) => params.isAttacking === true);
  character.stateMachine.addTransition('attacking', 'idle', 
    (gc, params) => Date.now() - params.attackStartTime > 500);

  // Start in idle state
  character.stateMachine.transitionTo('idle');

  // Start rendering
  renderer.animate();

  return { renderer, gameController, character };
}

// ============================================================================
// GAME LOOP & CONTROLS
// ============================================================================

let gameState = {
  isMoving: false,
  isAttacking: false,
  attackStartTime: 0,
  movement: { x: 0, y: 0, z: 0 },
  rotation: 0,
};

function setupGameControls(character) {
  document.addEventListener('keydown', (e) => {
    const keys = {
      'w': () => { gameState.isMoving = true; gameState.movement.z = -0.05; },
      'a': () => { gameState.isMoving = true; gameState.movement.x = -0.05; },
      's': () => { gameState.isMoving = true; gameState.movement.z = 0.05; },
      'd': () => { gameState.isMoving = true; gameState.movement.x = 0.05; },
      'space': () => {
        character.jump(1, 0.6);
      },
      'e': () => {
        gameState.isAttacking = true;
        gameState.attackStartTime = Date.now();
        character.attack();
      },
      '1': () => { character.wave(); },
    };

    if (keys[e.key.toLowerCase()]) {
      keys[e.key.toLowerCase()]();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
      gameState.isMoving = false;
      gameState.movement = { x: 0, y: 0, z: 0 };
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (e.buttons === 1) {  // Left mouse button
      gameState.rotation += e.movementX * 0.01;
      const torso = character.getPuppet('torso');
      if (torso) {
        torso.rotate(0, gameState.rotation, 0);
      }
    }
  });
}

// ============================================================================
// INITIALIZE
// ============================================================================

window.addEventListener('load', async () => {
  const canvas = document.getElementById('canvas');
  const { renderer, gameController, character } = await setupGameCharacter(canvas);

  setupGameControls(character);

  // Game loop
  setInterval(() => {
    // Update character state machine
    character.stateMachine.update(0.016, gameState);

    // Apply movement
    const torso = character.getPuppet('torso');
    if (torso) {
      torso.moveX(gameState.movement.x);
      torso.moveZ(gameState.movement.z);
    }

    // Update attack state
    if (gameState.isAttacking && Date.now() - gameState.attackStartTime > 500) {
      gameState.isAttacking = false;
    }
  }, 16);

  // Show controls
  const info = document.getElementById('info');
  if (info) {
    info.innerHTML = `
      <h3>Game Character Controls</h3>
      <ul>
        <li><strong>W/A/S/D</strong> - Move character</li>
        <li><strong>Mouse Drag</strong> - Rotate character</li>
        <li><strong>Space</strong> - Jump</li>
        <li><strong>E</strong> - Attack</li>
        <li><strong>1</strong> - Wave</li>
      </ul>
    `;
  }
});
