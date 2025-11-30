# SVG3 Game Control System - Complete Guide

**Turn your SVG3 scenes into fully controllable game characters and interactive models.**

---

## 🎮 Overview

The SVG3 Game Control System adds professional game development capabilities:

- ✅ **Skeletal animation** - Hierarchical bone control with parent-child relationships
- ✅ **Puppet control** - Simple API to move, rotate, and scale any body part
- ✅ **State machines** - Smooth animation transitions between states (idle, walk, run, attack)
- ✅ **Inverse kinematics** - Position limbs by target location (reach for objects)
- ✅ **Real-time manipulation** - Move, rotate, scale any mesh property while rendering
- ✅ **Game loop integration** - Works with any game engine (Babylon.js, Playcanvas, custom)

---

## 📦 Components

### 1. **SVG3GameController** - Main game control API

```javascript
import { SVG3GameController, enableGameControls } from './svg3-game-controls.js';

// Enable game controls on a renderer
const gameController = enableGameControls(renderer);

// Setup skeletal bones
gameController.setupBones([
  { id: 'torso', parent: null, position: [0, 0, 0] },
  { id: 'left-arm', parent: 'torso', position: [1, 0, 0] },
  { id: 'left-hand', parent: 'left-arm', position: [1, 0, 0] },
]);

// Control bones
gameController.rotateBone('left-arm', [0, 0, Math.PI / 4], true);  // Rotate 45°
gameController.moveBone('left-hand', [0, -0.5, 0], false);  // Move relative
gameController.scaleBone('torso', [1, 1.2, 1], true);  // Scale absolute
```

### 2. **PuppetControl** - Fluent API for convenience

```javascript
import { PuppetControl } from './svg3-game-controls.js';

const puppet = new PuppetControl(gameController, 'left-arm');

// Chainable API
puppet
  .rotateZ(Math.PI / 4)
  .moveY(0.5)
  .scale(1.1, 1.1, 1.1)
  .animate('rotation', [0, 0, 0], [0, 0, Math.PI / 2], 0.5);

// Get state
const position = puppet.getPosition();  // [x, y, z]
const rotation = puppet.getRotation();  // [x, y, z]
const scale = puppet.getScale();        // [x, y, z]

// Reset
puppet.reset();
```

### 3. **GameCharacter** - High-level character API

```javascript
import { GameCharacter } from './svg3-game-controls.js';

const character = new GameCharacter('Player', gameController, boneDefinitions);

// Get puppet for specific body part
const arm = character.getPuppet('left-arm');
arm.rotateZ(Math.PI / 8);

// Built-in animations
character.attack();      // Swing arm
character.wave();        // Wave hand
character.walk(2);       // Walk for 2 seconds
character.jump(2, 0.6);  // Jump 2 units high in 0.6 seconds

// Setup IK for limbs
character.setupIK('left-arm', 'left-arm', 'left-hand');
character.moveLimbToTarget('left-arm', [1, 0.5, 0]);

// Save/load state
const savedState = character.getState();
character.setState(savedState);
```

### 4. **AnimationStateMachine** - State-based animation system

```javascript
import { AnimationStateMachine } from './svg3-game-controls.js';

const fsm = new AnimationStateMachine(gameController);

// Add states with animation logic
fsm.addState('idle', (gc, dt, params) => {
  const head = gc.getBone('head');
  head.mesh.rotation.y = Math.sin(Date.now() / 2000) * 0.2;
});

fsm.addState('running', (gc, dt, params) => {
  // Leg and arm swinging
  const time = Date.now() / 300;
  gc.getBone('left-leg').mesh.rotation.x = Math.sin(time) * 0.5;
  gc.getBone('right-leg').mesh.rotation.x = Math.sin(time + Math.PI) * 0.5;
});

// Add transitions with conditions
fsm.addTransition('idle', 'running', 
  (gc, params) => params.speed > 0);

fsm.addTransition('running', 'idle', 
  (gc, params) => params.speed === 0);

// Start state machine
fsm.transitionTo('idle');

// Update each frame
fsm.update(0.016, { speed: currentSpeed });
```

### 5. **IKSolver** - Inverse kinematics for limbs

```javascript
import { IKSolver } from './svg3-game-controls.js';

const ikSolver = new IKSolver('right-shoulder', 'right-hand', bones);

// Position hand at target location
ikSolver.solve([1, 1, 0]);  // Reach to [x, y, z]

// Bones automatically align to reach target
```

---

## 🎮 Game Integration Examples

### Example 1: Simple Character Controller

```javascript
const gameState = {
  isMoving: false,
  isFacing: 0,  // radians
};

// Setup keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.key === 'w') {
    gameState.isMoving = true;
    // Move character forward
    character.getPuppet('torso').moveZ(-0.1);
  }
  if (e.key === 'a') {
    gameState.isFacing += 0.1;
  }
  if (e.key === 'd') {
    gameState.isFacing -= 0.1;
  }
});

// Game loop
setInterval(() => {
  // Update state machine based on movement
  if (gameState.isMoving) {
    character.stateMachine.transitionTo('running');
  } else {
    character.stateMachine.transitionTo('idle');
  }

  // Rotate character to face direction
  character.getPuppet('torso').rotate(0, gameState.isFacing, 0);

  // Update animations
  character.stateMachine.update(0.016, gameState);
}, 16);
```

### Example 2: NPC with Behavior Tree

```javascript
class NPCBehavior {
  constructor(character) {
    this.character = character;
    this.behavior = 'idle';
    this.targetPosition = null;
    this.idleTimer = 0;
  }

  update(deltaTime) {
    switch (this.behavior) {
      case 'idle':
        this.character.stateMachine.transitionTo('idle');
        this.idleTimer += deltaTime;
        
        // Wave occasionally
        if (this.idleTimer > 5) {
          this.character.wave();
          this.idleTimer = 0;
        }
        
        // Random chance to start walking
        if (Math.random() > 0.99) {
          this.behavior = 'walking';
          this.targetPosition = [
            Math.random() * 4 - 2,
            0,
            Math.random() * 4 - 2
          ];
        }
        break;

      case 'walking':
        this.character.stateMachine.transitionTo('walking');
        
        const torso = this.character.getPuppet('torso');
        const currentPos = torso.getPosition();
        
        // Move toward target
        const dx = this.targetPosition[0] - currentPos[0];
        const dz = this.targetPosition[2] - currentPos[2];
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        if (dist < 0.2) {
          this.behavior = 'idle';
        } else {
          torso.moveX(dx * 0.01);
          torso.moveZ(dz * 0.01);
        }
        break;
    }
  }
}

const npc = new NPCBehavior(character);
setInterval(() => npc.update(0.016), 16);
```

### Example 3: Motion Capture Playback

```javascript
class MotionPlayer {
  constructor(character) {
    this.character = character;
    this.recording = [];
    this.playbackIndex = 0;
  }

  record() {
    this.recording = [];
    setInterval(() => {
      this.recording.push(this.character.getState());
    }, 16);
  }

  play() {
    this.playbackIndex = 0;
    const playInterval = setInterval(() => {
      if (this.playbackIndex >= this.recording.length) {
        clearInterval(playInterval);
        return;
      }
      
      const state = this.recording[this.playbackIndex];
      this.character.setState(state);
      this.playbackIndex++;
    }, 16);
  }
}

const motionPlayer = new MotionPlayer(character);
motionPlayer.record();
// ... perform actions
motionPlayer.play();  // Replay recorded actions
```

### Example 4: Ragdoll Physics Integration

```javascript
class RagdollController {
  constructor(character, cannon) {
    this.character = character;
    this.cannon = cannon;  // Cannon.js physics engine
    this.ragdollBodies = new Map();
  }

  setupRagdoll() {
    const bones = this.character.gameController.getAllBones();
    
    bones.forEach(bone => {
      // Create physics body for each bone
      const body = new this.cannon.Body({
        mass: 1,
        shape: new this.cannon.Sphere(0.2)
      });
      body.position.set(...bone.position);
      this.cannon.addBody(body);
      this.ragdollBodies.set(bone.id, body);
    });
  }

  enableRagdoll() {
    // Disable skeletal control
    setInterval(() => {
      const bones = this.character.gameController.getAllBones();
      bones.forEach(bone => {
        const physicsBody = this.ragdollBodies.get(bone.id);
        
        // Sync mesh to physics body
        const puppet = this.character.getPuppet(bone.id);
        puppet.move(...physicsBody.position.toArray());
        puppet.rotate(...physicsBody.quaternion.toEuler(new Float32Array(3)));
      });
    }, 16);
  }
}
```

---

## 🎨 SVG3 Character Template

Define a game character in SVG3:

```xml
<svg3>
  <defs>
    <!-- Geometries for each body part -->
    <geometry id="head-geom" type="sphere" radius="0.4" />
    <geometry id="torso-geom" type="box" width="0.6" height="1" depth="0.4" />
    <geometry id="limb-geom" type="cylinder" radiusTop="0.15" radiusBottom="0.15" height="0.8" />
    
    <!-- Materials -->
    <material id="skin" type="standard" color="#f4a460" metalness="0.1" roughness="0.7" />
    <material id="clothing" type="standard" color="#2c3e50" metalness="0.2" roughness="0.6" />
  </defs>

  <scene camera="cam1">
    <camera id="cam1" position="0,0.5,3" />
    <light type="directional" intensity="0.8" color="#ffffff" position="3,3,3" />
    
    <group id="character-root">
      <!-- Each mesh is a controllable bone -->
      <mesh id="torso" geometry="torso-geom" material="clothing" position="0,0,0" />
      <mesh id="head" geometry="head-geom" material="skin" position="0,0.7,0" />
      <mesh id="left-arm" geometry="limb-geom" material="clothing" position="0.35,0.3,0" />
      <mesh id="right-arm" geometry="limb-geom" material="clothing" position="-0.35,0.3,0" />
      <mesh id="left-leg" geometry="limb-geom" material="clothing" position="0.2,-0.5,0" />
      <mesh id="right-leg" geometry="limb-geom" material="clothing" position="-0.2,-0.5,0" />
    </group>
  </scene>
</svg3>
```

---

## 🔧 API Reference

### SVG3GameController

```javascript
// Setup
setupBones(boneDefinitions)
getBone(boneId) → Bone

// Control
rotateBone(boneId, rotation, absolute = true)
moveBone(boneId, position, absolute = true)
scaleBone(boneId, scale, absolute = true)
animateBone(boneId, property, from, to, duration)

// Query
getAllBones() → BoneState[]
resetBone(boneId)
resetAll()
```

### PuppetControl

```javascript
// Chainable transforms
rotate(x, y, z) → this
rotateX(angle) → this
rotateY(angle) → this
rotateZ(angle) → this

move(x, y, z) → this
moveX(distance) → this
moveY(distance) → this
moveZ(distance) → this

scale(x, y, z) → this
animate(property, from, to, duration) → this
reset() → this

// Query
getPosition() → [x, y, z]
getRotation() → [x, y, z]
getScale() → [x, y, z]
```

### GameCharacter

```javascript
// Puppets
getPuppet(boneId) → PuppetControl

// IK
setupIK(limbName, rootBoneId, endBoneId)
moveLimbToTarget(limbName, targetPosition)

// Built-in animations
attack()
wave()
walk(duration)
jump(height, duration)

// State
getState() → BoneState[]
setState(boneStates)

// Access
stateMachine → AnimationStateMachine
gameController → SVG3GameController
```

### AnimationStateMachine

```javascript
// Define
addState(stateName, callback(gc, dt, params))
addTransition(fromState, toState, condition(gc, params) → boolean)

// Control
transitionTo(stateName)
update(deltaTime, params)
```

---

## 🚀 Production Checklist

- [ ] Test character with all animations
- [ ] Verify IK solver smoothness
- [ ] Optimize bone count (physics simulation expensive)
- [ ] Setup fallback for unsupported browsers
- [ ] Load characters asynchronously
- [ ] Cache compiled shaders
- [ ] Profile performance with DevTools

---

## 💡 Advanced Patterns

### Blending Between Animations

```javascript
class AnimationBlender {
  constructor(character) {
    this.character = character;
    this.blend = 0;  // 0 = animation 1, 1 = animation 2
  }

  blend(boneId, anim1State, anim2State, blendFactor) {
    const puppet = this.character.getPuppet(boneId);
    const interpolated = anim1State.map((v, i) => 
      v + (anim2State[i] - v) * blendFactor
    );
    puppet.rotate(...interpolated);
  }
}
```

### Procedural Animation

```javascript
class ProceduralWalk {
  walk(character, speed = 1) {
    const time = Date.now() / (500 / speed);
    
    character.getPuppet('left-leg').rotateX(Math.sin(time) * 0.3);
    character.getPuppet('right-leg').rotateX(Math.sin(time + Math.PI) * 0.3);
    character.getPuppet('left-arm').rotateX(Math.sin(time + Math.PI) * 0.2);
    character.getPuppet('right-arm').rotateX(Math.sin(time) * 0.2);
  }
}
```

### Constraint-based Animation

```javascript
class ConstraintAnimator {
  constrainDistance(bone1Id, bone2Id, maxDistance) {
    setInterval(() => {
      const b1 = this.character.gameController.getBone(bone1Id);
      const b2 = this.character.gameController.getBone(bone2Id);
      
      const dist = b1.mesh.position.distanceTo(b2.mesh.position);
      if (dist > maxDistance) {
        // Adjust position
        const direction = b2.mesh.position.clone()
          .sub(b1.mesh.position).normalize();
        b2.mesh.position.copy(
          b1.mesh.position.clone().addScaledVector(direction, maxDistance)
        );
      }
    }, 16);
  }
}
```

---

## 📞 Common Questions

**Q: Can I use multiple characters?**
A: Yes! Create multiple GameCharacter instances with different SVG3 scenes.

**Q: How do I integrate with a physics engine?**
A: Create physics bodies for bones and sync their transforms each frame.

**Q: Can I blend between animations?**
A: Yes, interpolate between bone states and apply the result.

**Q: What's the bone limit for performance?**
A: 50-100 bones smooth at 60fps on modern hardware. Test your case.

**Q: Can I export animations?**
A: Yes, use character.getState() to save bone configurations as JSON.

---

## 🎯 Next Steps

1. Create your character in SVG3 format
2. Setup bones with GameCharacter
3. Add state machine animations
4. Integrate with your game loop
5. Test and optimize performance

**Happy game development! 🎮**
