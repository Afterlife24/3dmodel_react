import { useEffect, useRef } from "react";
import { useGLTF, useAnimations, OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Model({
  currentAnimation,
  setCurrentAnimation,
  isWidget,
}) {
  const group = useRef();
  const { scene, animations } = useGLTF("/idle_wave_talk_glb.glb");
  const { actions, mixer } = useAnimations(animations, group);
  const previousAction = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    console.log("Available animations:", Object.keys(actions));
  }, [actions]);

  useEffect(() => {
    if (!actions[currentAnimation]) {
      console.warn(`Animation "${currentAnimation}" not found`);
      return;
    }

    const action = actions[currentAnimation];

    // Smooth crossfade from previous animation
    if (previousAction.current && previousAction.current !== action) {
      const fadeOutDuration = currentAnimation === "idle" ? 0.5 : 0.3;
      previousAction.current.fadeOut(fadeOutDuration);
    }

    const fadeInDuration = currentAnimation === "idle" ? 0.5 : 0.3;
    action.reset().fadeIn(fadeInDuration).play();

    if (currentAnimation === "idle") {
      // Idle loops forever at a relaxed pace
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.timeScale = 0.6;
    } else if (currentAnimation === "talk") {
      // Talk loops continuously while agent is speaking — useLiveKit
      // will set currentAnimation back to 'idle' when speech ends.
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.timeScale = 0.65;
      action.clampWhenFinished = false;
    } else if (currentAnimation === "wave") {
      // Wave plays once then returns to idle
      action.setLoop(THREE.LoopOnce, 1);
      action.timeScale = 0.7;
      action.clampWhenFinished = true;
    }

    previousAction.current = action;

    // Only auto-return to idle for one-shot animations (wave)
    const handleFinished = (e) => {
      if (e.action === action && currentAnimation === "wave") {
        setCurrentAnimation("idle");
      }
    };

    mixer.addEventListener("finished", handleFinished);

    return () => {
      mixer.removeEventListener("finished", handleFinished);
    };
  }, [currentAnimation, actions, mixer, setCurrentAnimation]);

  useFrame((state, delta) => {
    mixer.update(delta);

    // In widget mode, face forward. In fullscreen, follow cursor.
    if (isWidget) {
      mouse.current.x = THREE.MathUtils.lerp(mouse.current.x, 0, 0.05);
    } else {
      mouse.current.x = THREE.MathUtils.lerp(
        mouse.current.x,
        state.pointer.x,
        0.05,
      );
    }

    if (group.current) {
      group.current.rotation.y = mouse.current.x * 0.4;
      group.current.rotation.x = 0.05;
    }
  });

  return (
    <>
      <primitive ref={group} object={scene} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        target={[0, 1, 0]}
      />
    </>
  );
}

useGLTF.preload("/idle_wave_talk_glb.glb");
