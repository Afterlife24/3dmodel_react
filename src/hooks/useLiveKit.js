import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Room,
    RoomEvent,
    Track,
    ParticipantEvent,
    ConnectionState,
    createLocalAudioTrack,
} from 'livekit-client'

// Flask token server URL — set in .env as VITE_TOKEN_SERVER
const TOKEN_SERVER = import.meta.env.VITE_TOKEN_SERVER || 'http://localhost:5001'

// Generate a random visitor name
function guestName() {
    return 'visitor-' + Math.random().toString(36).slice(2, 7)
}

export function useLiveKit({ onAnimationChange }) {
    // 'connecting' | 'connected' | 'greeting' | 'listening' | 'speaking' | 'disconnected' | 'error'
    const [status, setStatus] = useState('connecting')
    const [agentText, setAgentText] = useState('')
    const [userText, setUserText] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    const roomRef = useRef(null)
    const isFirstSpeech = useRef(true)

    const handleAgentConnected = useCallback(() => {
        // Agent joined room — stay in 'connected', wait for first speech
        setStatus('connected')
    }, [])

    // ── Connect to LiveKit room ───────────────────────────────────────────
    useEffect(() => {
        let room = null
        let localTrack = null
        let cancelled = false

        async function connect() {
            try {
                // 1. Fetch token from Flask server
                const name = guestName()
                const res = await fetch(
                    `${TOKEN_SERVER}/getToken?name=${encodeURIComponent(name)}&language=en`
                )
                if (!res.ok) throw new Error(`Token server error: ${res.status}`)
                const token = await res.text()

                if (cancelled) return

                // 2. Create and configure room
                room = new Room({
                    adaptiveStream: true,
                    dynacast: true,
                    audioCaptureDefaults: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                    },
                    audioOutput: {
                        deviceId: 'default',
                    },
                })
                roomRef.current = room

                // 3. Wire up room events
                room.on(RoomEvent.ConnectionStateChanged, (state) => {
                    if (state === ConnectionState.Connected) {
                        setStatus('connected')
                    } else if (state === ConnectionState.Disconnected) {
                        setStatus('disconnected')
                        onAnimationChange('idle')
                    } else if (state === ConnectionState.Reconnecting) {
                        setStatus('connecting')
                    }
                })

                // Agent participant joined
                room.on(RoomEvent.ParticipantConnected, (participant) => {
                    if (!participant.isLocal) {
                        handleAgentConnected()
                        wireAgentParticipant(participant)
                    }
                })

                // Handle already-connected participants
                room.on(RoomEvent.Connected, () => {
                    for (const participant of room.remoteParticipants.values()) {
                        handleAgentConnected()
                        wireAgentParticipant(participant)
                        break
                    }
                })

                // Track subscribed — play agent audio
                room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                    if (track.kind === Track.Kind.Audio && !participant.isLocal) {
                        track.attach()
                    }
                })

                // Data messages from agent (transcripts)
                room.on(RoomEvent.DataReceived, (data) => {
                    try {
                        const msg = JSON.parse(new TextDecoder().decode(data))
                        if (msg.type === 'transcript') {
                            if (msg.role === 'agent') setAgentText(msg.text)
                            if (msg.role === 'user') setUserText(msg.text)
                        }
                    } catch (_) { /* non-JSON data, ignore */ }
                })

                // 4. Connect to LiveKit cloud
                const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://afterlife-r47izg99.livekit.cloud'
                await room.connect(livekitUrl, token)

                if (cancelled) {
                    await room.disconnect()
                    return
                }

                // 5. Publish local microphone — stay 'connected', NOT 'listening' yet
                // Status moves to 'listening' only AFTER agent finishes greeting
                localTrack = await createLocalAudioTrack({
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                })
                await room.localParticipant.publishTrack(localTrack)
                // Do NOT set 'listening' here — wait for agent to speak first

            } catch (err) {
                if (!cancelled) {
                    console.error('LiveKit connection error:', err)
                    setErrorMsg(err.message)
                    setStatus('error')
                    onAnimationChange('idle')
                }
            }
        }

        // Wire agent speaking state → animations + status
        function wireAgentParticipant(participant) {
            participant.on(ParticipantEvent.IsSpeakingChanged, (speaking) => {
                if (speaking) {
                    if (isFirstSpeech.current) {
                        // First speech = greeting → wave + talk simultaneously
                        isFirstSpeech.current = false
                        onAnimationChange('wave')
                        setTimeout(() => onAnimationChange('talk'), 2200)
                    } else {
                        onAnimationChange('talk')
                    }
                    setStatus('speaking')
                } else {
                    // Agent finished speaking (greeting done or reply done)
                    // NOW go to listening
                    setStatus('listening')
                    onAnimationChange('idle')
                }
            })

            participant.on(ParticipantEvent.TrackMuted, () => {
                setStatus('listening')
                onAnimationChange('idle')
            })
        }

        connect()

        return () => {
            cancelled = true
            if (localTrack) localTrack.stop()
            if (room) room.disconnect()
        }
    }, [handleAgentConnected, onAnimationChange])

    return { status, agentText, userText, errorMsg }
}
