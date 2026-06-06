import { useState, useEffect, useRef } from "react";

/**
 * Streaming typewriter: appends new characters as `text` grows.
 * When `text` extends the previous value, only the new portion types in.
 * When `text` is completely different (new sentence), resets and types fresh.
 */
export default function TypewriterText({ text, speed = 25, className }) {
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef(null);
  const prevTextRef = useRef("");
  const targetRef = useRef("");
  const posRef = useRef(0);

  useEffect(() => {
    if (!text) {
      // Clear everything
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayed("");
      setIsTyping(false);
      prevTextRef.current = "";
      targetRef.current = "";
      posRef.current = 0;
      return;
    }

    const prev = prevTextRef.current;

    // Check if new text extends the old one (streaming append)
    if (text.startsWith(prev) && prev.length > 0) {
      // Text grew — just update the target, typing will continue
      targetRef.current = text;
      prevTextRef.current = text;

      // If not already typing, start from where we left off
      if (!intervalRef.current) {
        setIsTyping(true);
        intervalRef.current = setInterval(() => {
          posRef.current++;
          if (posRef.current <= targetRef.current.length) {
            setDisplayed(targetRef.current.slice(0, posRef.current));
          } else {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsTyping(false);
          }
        }, speed);
      }
    } else {
      // Completely new text — reset and type from scratch
      if (intervalRef.current) clearInterval(intervalRef.current);
      targetRef.current = text;
      prevTextRef.current = text;
      posRef.current = 0;
      setDisplayed("");
      setIsTyping(true);

      intervalRef.current = setInterval(() => {
        posRef.current++;
        if (posRef.current <= targetRef.current.length) {
          setDisplayed(targetRef.current.slice(0, posRef.current));
        } else {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsTyping(false);
        }
      }, speed);
    }

    return () => {
      // Don't clear on re-render — only on unmount
    };
  }, [text, speed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Show only the recent portion if text is long (keeps bubble compact ~3 lines)
  // Leading "..." fades in when older text gets trimmed
  const maxChars = 120;
  const isTrimmed = displayed.length > maxChars;
  const visibleText = isTrimmed ? displayed.slice(-maxChars) : displayed;

  return (
    <span className={className}>
      {isTrimmed && <span className="agent-text-ellipsis">... </span>}
      {visibleText}
      {isTyping && <span className="typewriter-cursor" />}
    </span>
  );
}
