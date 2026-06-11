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
const TOKEN_SERVER = import.meta.env.VITE_TOKEN_SERVER

// Generate a random visitor name
function guestName() {
    return 'visitor-' + Math.random().toString(36).slice(2, 7)
}

export function useLiveKit({ onAnimationChange, enabled = true }) {
    // 'connecting' | 'connected' | 'greeting' | 'listening' | 'speaking' | 'disconnected' | 'error'
    const [status, setStatus] = useState('connecting')
    const [agentText, setAgentText] = useState('')
    const [userText, setUserText] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    const roomRef = useRef(null)
    const localTrackRef = useRef(null)
    const isFirstSpeech = useRef(true)
    const [isMicMuted, setIsMicMuted] = useState(false)

    const handleAgentConnected = useCallback(() => {
        // Agent joined room — stay in 'connected', wait for first speech
        setStatus('connected')
    }, [])

    // ── Connect to LiveKit room ───────────────────────────────────────────
    useEffect(() => {
        // Don't connect until enabled (e.g. user is authenticated)
        if (!enabled) {
            setStatus('connecting')
            return
        }

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

                // Transcription received from agent SDK (automatic forwarding)
                room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
                    // segments is an array of { text, final, ... }
                    // Combine all segment texts
                    const text = segments.map(s => s.text).join(' ').trim()
                    if (!text) return

                    // Filter out function tool calls — they look like JSON or contain tool patterns
                    if (
                        text.startsWith('{') ||
                        text.startsWith('[') ||
                        text.includes('"name":') ||
                        text.includes('"action":') ||
                        text.includes('function_call') ||
                        text.includes('navigate_to_section') ||
                        text.includes('open_url') ||
                        text.includes('get_product_info') ||
                        text.includes('show_company_details_form')
                    ) {
                        return
                    }

                    if (participant && !participant.isLocal) {
                        // Agent speaking
                        setAgentText(text)
                    } else if (participant && participant.isLocal) {
                        // User (STT transcription of local audio)
                        setUserText(text)
                    }
                })

                // Fallback: data messages from agent (legacy custom transcripts)
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
                const livekitUrl = import.meta.env.VITE_LIVEKIT_URL
                await room.connect(livekitUrl, token)

                if (cancelled) {
                    await room.disconnect()
                    return
                }

                // 5. Register RPC handler for agent navigation commands
                // Guarded: older livekit-client versions may not have registerRpcMethod.
                // A failure here must NOT surface as a connection error.
                try {
                    if (typeof room.localParticipant.registerRpcMethod === 'function') {
                        console.log('[Navigation] Registering RPC method "navigate"')
                        room.localParticipant.registerRpcMethod('navigate', async (data) => {
                            try {
                                const navigationData = JSON.parse(data.payload)
                                console.log('[Navigation] RPC received:', navigationData)

                                if (navigationData.type === 'navigate') {
                                    if (navigationData.action === 'open_url') {
                                        window.open(navigationData.url, '_blank')
                                        return JSON.stringify({ success: true, message: 'URL opened' })
                                    } else if (navigationData.action === 'show_company_form') {
                                        // Dispatch event to show company details modal
                                        const event = new CustomEvent('show-company-form')
                                        window.dispatchEvent(event)
                                        return JSON.stringify({ success: true, message: 'Company form shown' })
                                    } else if (navigationData.action === 'navigate_same_tab') {
                                        let targetUrl = navigationData.path
                                        if (navigationData.section) {
                                            const scrollSections = ['vision', 'services', 'testimonials', 'meet-assistants', 'demo', 'ai-workforce', 'whatsapp-agent', 'web-agent', 'industries']
                                            const action = scrollSections.includes(navigationData.section) ? 'scroll' : 'expand'
                                            targetUrl = `${navigationData.path}?action=${action}&section=${navigationData.section}`
                                        }
                                        const event = new CustomEvent('agent-navigate', { detail: { url: targetUrl } })
                                        window.dispatchEvent(event)
                                        return JSON.stringify({ success: true, message: 'Navigation initiated' })
                                    }
                                }
                                return JSON.stringify({ success: false, message: 'Unknown action' })
                            } catch (err) {
                                console.error('[Navigation] RPC error:', err)
                                return JSON.stringify({ success: false, message: `Error: ${err}` })
                            }
                        })
                    } else {
                        console.warn('[Navigation] registerRpcMethod not available in this livekit-client version')
                    }
                } catch (rpcErr) {
                    console.warn('[Navigation] Failed to register RPC method:', rpcErr)
                }

                // 6. Publish local microphone — stay 'connected', NOT 'listening' yet
                // Status moves to 'listening' only AFTER agent finishes greeting.
                // A mic failure should not show a connection error either.
                try {
                    localTrack = await createLocalAudioTrack({
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                    })
                    await room.localParticipant.publishTrack(localTrack)
                    localTrackRef.current = localTrack
                } catch (micErr) {
                    console.warn('[Mic] Failed to publish local audio track:', micErr)
                }
                // Do NOT set 'listening' here — wait for agent to speak first

            } catch (err) {
                // Only real connection failures (token fetch / room.connect) reach here.
                if (!cancelled) {
                    console.error('LiveKit connection error:', err)
                    setErrorMsg('Network error. Please check your connection and try again.')
                    setStatus('error')
                    onAnimationChange('idle')
                }
            }
        }

        // Wire agent speaking state → animations + status
        function wireAgentParticipant(participant) {
            let speakingTimeout = null
            let isSpeaking = false

            // Use ActiveSpeakersChanged at room level for more reliable detection
            room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                const agentSpeaking = speakers.some(s => !s.isLocal)

                if (agentSpeaking && !isSpeaking) {
                    isSpeaking = true

                    // Cancel any pending idle transition
                    if (speakingTimeout) {
                        clearTimeout(speakingTimeout)
                        speakingTimeout = null
                    }

                    if (isFirstSpeech.current) {
                        // First speech = greeting → wave then talk
                        isFirstSpeech.current = false
                        onAnimationChange('wave')
                        setTimeout(() => onAnimationChange('talk'), 1500)
                    } else {
                        onAnimationChange('talk')
                    }
                    setStatus('speaking')
                } else if (!agentSpeaking && isSpeaking) {
                    isSpeaking = false

                    // Debounce: TTS streams have natural pauses between chunks.
                    // 600ms is enough to bridge short pauses without feeling laggy.
                    speakingTimeout = setTimeout(() => {
                        setStatus('listening')
                        onAnimationChange('idle')
                        speakingTimeout = null
                    }, 600)
                }
            })

            // Fallback: IsSpeakingChanged on the participant for edge cases
            participant.on(ParticipantEvent.IsSpeakingChanged, (speaking) => {
                if (speaking && !isSpeaking) {
                    isSpeaking = true

                    if (speakingTimeout) {
                        clearTimeout(speakingTimeout)
                        speakingTimeout = null
                    }

                    if (isFirstSpeech.current) {
                        isFirstSpeech.current = false
                        onAnimationChange('wave')
                        setTimeout(() => onAnimationChange('talk'), 1500)
                    } else {
                        onAnimationChange('talk')
                    }
                    setStatus('speaking')
                } else if (!speaking && isSpeaking) {
                    isSpeaking = false

                    speakingTimeout = setTimeout(() => {
                        setStatus('listening')
                        onAnimationChange('idle')
                        speakingTimeout = null
                    }, 600)
                }
            })

            participant.on(ParticipantEvent.TrackMuted, () => {
                isSpeaking = false
                if (speakingTimeout) {
                    clearTimeout(speakingTimeout)
                    speakingTimeout = null
                }
                setStatus('listening')
                onAnimationChange('idle')
            })
        }

        connect()

        return () => {
            cancelled = true
            if (localTrack) localTrack.stop()
            localTrackRef.current = null
            if (room) room.disconnect()
        }
    }, [handleAgentConnected, onAnimationChange, enabled])

    const toggleMic = useCallback(() => {
        const track = localTrackRef.current
        if (!track) return
        if (isMicMuted) {
            track.unmute()
            setIsMicMuted(false)
        } else {
            track.mute()
            setIsMicMuted(true)
        }
    }, [isMicMuted])

    return { status, agentText, userText, errorMsg, isMicMuted, toggleMic }
}
