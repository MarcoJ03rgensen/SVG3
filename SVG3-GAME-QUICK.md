# SVG3 Game Controls - Quick Integration Guide

Add game character control to your SVG3 scenes in 5 minutes.

---

## 🎮 What You Get

```javascript
import { GameCharacter, enableGameControls } from './svg3-game-controls.js';

// 1. Create character
const character = new GameCharacter('Player', gameController, [
  { id: 'torso', parent: null },
  { id: 'left-arm', parent: 'torso' },
  { id: 'right-arm', parent: 'torso' },
]);

// 2. Control parts
character.getPuppet('left-arm').rotateZ(0.5);
character.getPuppet('torso').moveY(0.1);

// 3. Built-in animations
character.jump(2, 0.6);    // Jump 2 units high
character.attack();         // Swing arm
character.wave();          // Wave hand
character.walk(2);         // Walk for 2 seconds

// 4. State machine
character.stateMachine.addState('idle', (gc, dt) => {
  // Gentle head tilt animation
});
character.stateMachine.transitionTo('idle');
```

---

## ✨ Key Features

| Feature | Example | Use Case |
|---------|---------|----------|
| **Bone control** | `rotateBone('arm', [0,0,0.5])` | Rotate body parts |
| **Movement** | `moveBone('torso', [1,0,0])` | Move character in space |
| **Puppet API** | `puppet.rotateZ(0.5).moveY(0.1)` | Chainable operations |
| **IK Solver** | `moveLimbToTarget('arm', [1,0.5,0])` | Reach to positions |
| **State machine** | `fsm.addState('walk', cb)` | Animation transitions |
| **Built-in animations** | `character.jump()` | Pre-made actions |

---

## 🚀 3-Step Setup

### Step 1: Add to SVG3 Scene

Name your mesh elements to use as bones:

```xml
<mesh id="torso" geometry="box" material="mat1" position="0,0,0" />
<mesh id="left-arm" geometry="cylinder" material="mat2" position="0.5,0.3,0" />
<mesh id="right-arm" geometry="cylinder" material="mat2" position="-0.5,0.3,0" />
<mesh id="left-leg" geometry="cylinder" material="mat2" position="0.2,-0.5,0" />
<mesh id="right-leg" geometry="cylinder" material="mat2" position="-0.2,-0.5,0" />
```

### Step 2: Enable Game Controls

```javascript
import { enableGameControls, GameCharacter } from './svg3-game-controls.js';

// Setup renderer
const renderer = new SVG3ThreeRenderer(sceneData, canvas);
await renderer.init();

// Enable game controls
const gameController = enableGameControls(renderer);
```

### Step 3: Create Character

```javascript
const character = new GameCharacter('Player', gameController, [
  { id: 'torso', parent: null, position: [0, 0, 0] },
  { id: 'head', parent: 'torso', position: [0, 0.5, 0] },
  { id: 'left-arm', parent: 'torso', position: [0.5, 0.3, 0] },
  { id: 'right-arm', parent: 'torso', position: [-0.5, 0.3, 0] },
  { id: 'left-leg', parent: 'torso', position: [0.2, -0.5, 0] },
  { id: 'right-leg', parent: 'torso', position: [-0.2, -0.5, 0] },
]);

// Start using it!
character.getPuppet('left-arm').rotateZ(Math.PI / 4);
```

---

## 💡 Common Patterns

### Pattern 1: Keyboard Control

```javascript
const state = { isMoving: false, direction: 0 };

document.addEventListener('keydown', (e) => {
  if (e.key === 'w') {
    state.isMoving = true;
    character.getPuppet('torso').moveZ(-0.05);
  }
  if (e.key === 'a') {
    state.direction += 0.1;
  }
  if (e.key === 'd') {
    state.direction -= 0.1;
  }
  if (e.key === ' ') {
    character.jump(1, 0.6);
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'w') state.isMoving = false;
});

// Game loop
setInterval(() => {
  character.getPuppet('torso').rotate(0, state.direction, 0);
}, 16);
```

### Pattern 2: Attacking

```javascript
let isAttacking = false;

function attack() {
  if (isAttacking) return;
  
  isAttacking = true;
  character.attack();  // Built-in animation
  
  setTimeout(() => {
    isAttacking = false;
  }, 500);
}

document.addEventListener('click', attack);
```

### Pattern 3: Walking Animation

```javascript
character.stateMachine.addState('walking', (gc, dt) => {
  const time = Date.now() / 500;
  
  // Swing legs
  gc.getBone('left-leg').mesh.rotation.x = Math.sin(time) * 0.3;
  gc.getBone('right-leg').mesh.rotation.x = Math.sin(time + Math.PI) * 0.3;
  
  // Swing arms opposite to legs
  gc.getBone('left-arm').mesh.rotation.x = Math.sin(time + Math.PI) * 0.2;
  gc.getBone('right-arm').mesh.rotation.x = Math.sin(time) * 0.2;
});

character.stateMachine.transitionTo('walking');
```

### Pattern 4: Reaching (IK)

```javascript
// Setup IK for arm reaching
character.setupIK('left-arm', 'left-arm', 'left-hand');

// Move hand to a target position
function reachToObject(targetPos) {
  character.moveLimbToTarget('left-arm', targetPos);
}

// Player clicks on object
canvas.addEventListener('click', (e) => {
  const targetPos = [
    (e.clientX / canvas.width) * 2 - 1,
    (e.clientY / canvas.height) * 2 - 1,
    1
  ];
  reachToObject(targetPos);
});
```

### Pattern 5: Animation State Machine

```javascript
const fsm = character.stateMachine;

fsm.addState('idle', (gc, dt) => {
  const head = gc.getBone('head');
  head.mesh.rotation.y = Math.sin(Date.now() / 2000) * 0.2;
});

fsm.addState('running', (gc, dt) => {
  // Faster leg movement
  const time = Date.now() / 300;
  gc.getBone('left-leg').mesh.rotation.x = Math.sin(time) * 0.5;
  gc.getBone('right-leg').mesh.rotation.x = Math.sin(time + Math.PI) * 0.5;
});

fsm.addState('jumping', (gc, dt) => {
  // Jump arc
  const jump = Math.sin(Date.now() / 600) * 1.5;
  gc.getBone('torso').mesh.position.y = jump;
});

// Transitions
fsm.addTransition('idle', 'running', (gc, p) => p.speed > 0);
fsm.addTransition('running', 'idle', (gc, p) => p.speed === 0);
fsm.addTransition('idle', 'jumping', (gc, p) => p.jumping === true);
fsm.addTransition('jumping', 'idle', (gc, p) => p.jump Height < 0.1);

// Update each frame
const params = { speed: currentSpeed, jumping: isJumping, jumpHeight: currentJump };
fsm.update(0.016, params);
```

---

## 🎯 API Cheat Sheet

```javascript
// Get puppet for bone
const puppet = character.getPuppet('left-arm');

// Transform operations
puppet.rotateX(angle)        // Rotate around X
puppet.rotateY(angle)        // Rotate around Y
puppet.rotateZ(angle)        // Rotate around Z
puppet.rotate(x, y, z)       // Set rotation

puppet.moveX(distance)       // Move along X
puppet.moveY(distance)       // Move along Y
puppet.moveZ(distance)       // Move along Z
puppet.move(x, y, z)         // Set position

puppet.scale(x, y, z)        // Set scale

// Animate
puppet.animate('rotation', [0,0,0], [0,0,Math.PI], 1.0)
puppet.animate('position', [0,0,0], [1,1,1], 0.5)

// Query
puppet.getPosition()         // Get [x, y, z]
puppet.getRotation()         // Get [x, y, z]
puppet.getScale()            // Get [x, y, z]

// Reset
puppet.reset()               // Return to original state

// Chainable
puppet
  .rotateZ(0.5)
  .moveY(0.1)
  .scale(1.1, 1, 1)
```

---

## 🔗 File Organization

```
your-game/
├── index.html
├── svg3-complete.js          (core + renderer)
├── svg3-game-controls.js     (game control system) ← NEW
├── svg3-game-character-example.js  (examples) ← NEW
├── characters/
│   └── player.svg3
├── scenes/
│   └── level-1.svg3
└── README.md
```

---

## 📚 Examples Included

The `svg3-game-character-example.js` file includes:

✅ Complete character setup in SVG3 format
✅ Game loop integration
✅ Keyboard input handling
✅ Attack/wave/jump animations
✅ State machine example
✅ Ready to modify and use

---

## 🚀 Next Steps

1. **Define your character** in SVG3 (name each mesh as a bone)
2. **Setup bones** with GameCharacter
3. **Add animations** using PuppetControl or state machine
4. **Integrate with game loop** (update each frame)
5. **Test and optimize** performance

---

## ⚡ Performance Tips

- **Limit bone count**: 30-50 bones is smooth, 100+ requires optimization
- **Simplify geometry**: Use lower poly models for performance
- **Cache puppets**: Store `character.getPuppet(id)` references
- **Batch updates**: Update all bones before render
- **Profile**: Use Chrome DevTools Performance tab

---

**You're now ready to build game characters with SVG3! 🎮**
