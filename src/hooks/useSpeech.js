import { useState, useEffect, useRef, useCallback } from 'react'

// Simple rule-based responses — swap for an AI API call later
const RESPONSES = [
    { keywords: ['hello', 'hi', 'hey'], reply: "Hello! Great to meet you. How can I help you today?" },
    { keywords: ['who are you', 'what are you', 'your name'], reply: "I'm an AI assistant from Autonomiq. I'm here to help you explore our AI agent solutions." },
    { keywords: ['product', 'agent', 'what do you offer', 'what do you do'], reply: "We offer three AI agents: a Web Agent for your website, a Voice Calling Agent for phone calls, and a WhatsApp Agent for messaging. Which one interests you?" },
    { keywords: ['web', 'website'], reply: "Our Web Agent is an interactive AI avatar that lives on your website, guides visitors, answers questions, and converts them into leads — just like me!" },
    { keywords: ['call', 'voice', 'phone', 'telecall'], reply: "Our Voice Calling Agent handles inbound and outbound calls with a natural human-like voice, available 24/7 for support, lead qualification, and appointment booking." },
    { keywords: ['whatsapp'], reply: "Our WhatsApp Agent automates customer conversations directly on WhatsApp — handling FAQs, orders, and lead generation around the clock." },
    { keywords: ['price', 'cost', 'pricing', 'how much'], reply: "Pricing depends on your business needs and usage. I'd recommend reaching out to our team for a tailored quote. Would you like me to help with that?" },
    { keywords: ['bye', 'goodbye', 'see you', 'thanks', 'thank you'], reply: "It was great talking with you! Feel free to come back anytime. Goodbye!" },
    { keywords: ['help', 'assist', 'support'], reply: "Of course! I can tell you about our AI agents, how they work, and how they can benefit your business. What would you like to know?" },
]

function getReply(transcript) {
    const lower = transcript.toLowerCase()
    for (const { keywords, reply } of RESPONSES) {
        if (keywords.some((kw) => lower.includes(kw))) return reply
    }
    return "That's a great question. Our team would be happy to give you a detailed answer. Would you like to get in touch with us?"
}

export function useSpeech({ onAnimationChange }) {
    const [status, setStatus] = useState('idle') // 'idle' | 'listening' | 'speaking'
    const [transcript, setTranscript] = useState('')
    const [reply, setReply] = useState('')

    const recognitionRef = useRef(null)
    const synthRef = useRef(null) // lazily assigned to avoid SSR / early-load crash
    const hasGreeted = useRef(false)
    const isSpeakingRef = useRef(false)

    // Lazily get speechSynthesis so it never crashes on load
    const getSynth = useCallback(() => {
        if (!synthRef.current && typeof window !== 'undefined' && window.speechSynthesis) {
            synthRef.current = window.speechSynthesis
        }
        return synthRef.current
    }, [])

    // ── startRecognition ─────────────────────────────────────────────────────
    const startRecognition = useCallback(() => {
        const recognition = recognitionRef.current
        if (!recognition || isSpeakingRef.current) return
        try {
            recognition.start()
            setStatus('listening')
            onAnimationChange('idle')
        } catch (_) {
            // already started — ignore
        }
    }, [onAnimationChange])

    // ── speak ────────────────────────────────────────────────────────────────
    // Plays talk animation while speaking, then auto-starts listening when done
    const speak = useCallback((text) => {
        const synth = getSynth()
        if (!synth) return // speech not supported
        synth.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.95
        utterance.pitch = 1.05
        utterance.volume = 1

        // Prefer a natural English voice
        const voices = synth.getVoices()
        const preferred =
            voices.find((v) =>
                v.lang.startsWith('en') &&
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
            ) || voices.find((v) => v.lang.startsWith('en'))
        if (preferred) utterance.voice = preferred

        utterance.onstart = () => {
            isSpeakingRef.current = true
            setStatus('speaking')
            onAnimationChange('talk')
        }

        utterance.onend = () => {
            isSpeakingRef.current = false
            setStatus('listening')
            onAnimationChange('idle')
            setTimeout(() => startRecognition(), 600)
        }

        utterance.onerror = () => {
            isSpeakingRef.current = false
            setStatus('listening')
            onAnimationChange('idle')
            setTimeout(() => startRecognition(), 600)
        }

        synth.speak(utterance)
    }, [onAnimationChange, startRecognition, getSynth])

    // ── Set up SpeechRecognition once ────────────────────────────────────────
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            console.warn('Web Speech API not supported. Use Chrome or Edge.')
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript
            setTranscript(text)
            const response = getReply(text)
            setReply(response)
            setTimeout(() => speak(response), 400)
        }

        recognition.onerror = (e) => {
            if (e.error === 'no-speech' || e.error === 'aborted') {
                if (!isSpeakingRef.current) setTimeout(() => startRecognition(), 300)
                return
            }
            console.error('Speech recognition error:', e.error)
        }

        recognition.onend = () => {
            if (!isSpeakingRef.current) setTimeout(() => startRecognition(), 300)
        }

        recognitionRef.current = recognition
    }, [speak, startRecognition])

    // ── Greeting on mount ────────────────────────────────────────────────────
    // wave animation + greeting speech fire at the SAME TIME
    // when speech ends → onend → auto-listen starts automatically
    useEffect(() => {
        if (hasGreeted.current) return
        hasGreeted.current = true

        onAnimationChange('wave')
        speak("Hi there! I'm your AI assistant from Autonomiq. How can I assist you today?")
    }, [speak, onAnimationChange])

    return { status, transcript, reply }
}
