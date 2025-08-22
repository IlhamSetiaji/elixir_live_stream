/**
 * WebRTC Client for handling peer-to-peer video communication
 * Uses Google's free STUN server for NAT traversal
 */
class WebRTCClient {
  constructor() {
    this.localStream = null
    this.remoteStream = null
    this.peerConnection = null
    this.localVideoElement = null
    this.remoteVideoElement = null
    this.signalingService = null
    this.isInitiator = false
    this.isMuted = false
    this.isCameraOff = false
    
    // Google's free STUN server
    this.rtcConfig = {
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302'
        },
        {
          urls: 'stun:stun1.l.google.com:19302'
        }
      ]
    }
    
    this.onStatusChange = null
    this.onPeerJoined = null
  }
  
  /**
   * Initialize the WebRTC client with signaling service
   */
  initialize(signalingService) {
    this.signalingService = signalingService
    this.setupSignalingEventHandlers()
  }
  
  /**
   * Set up event handlers for signaling service
   */
  setupSignalingEventHandlers() {
    if (!this.signalingService) return
    
    this.signalingService.onOffer = (offer) => {
      console.log("Received offer from peer")
      this.handleOffer(offer)
    }
    
    this.signalingService.onAnswer = (answer) => {
      console.log("Received answer from peer")
      this.handleAnswer(answer)
    }
    
    this.signalingService.onIceCandidate = (candidate) => {
      console.log("Received ICE candidate from peer")
      this.handleRemoteIceCandidate(candidate)
    }
    
    this.signalingService.onPeerJoined = (payload) => {
      console.log("Peer joined the room:", payload)
      this.updateStatus('Peer joined - Ready to call')
      this.onPeerJoined && this.onPeerJoined(payload)
    }
    
    this.signalingService.onPeerLeft = (payload) => {
      console.log("Peer left the room:", payload)
      this.handlePeerLeft()
      
      // Dispatch peer left event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('peer-left', {
          detail: payload
        }))
      }
    }
    
    this.signalingService.onConnected = (resp) => {
      console.log("Connected to signaling server:", resp)
      this.updateStatus('Connected to room')
    }
  }
  
  /**
   * Set local video element
   */
  setLocalVideoElement(videoElement) {
    this.localVideoElement = videoElement
  }
  
  /**
   * Set remote video element
   */
  setRemoteVideoElement(videoElement) {
    this.remoteVideoElement = videoElement
  }
  
  /**
   * Start local video stream
   */
  async startLocalVideo() {
    try {
      const constraints = {
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (this.localVideoElement) {
        this.localVideoElement.srcObject = this.localStream
      }
      
      this.updateStatus('Local video started')
      return this.localStream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      this.updateStatus('Error accessing camera/microphone')
      throw error
    }
  }
  
  /**
   * Create peer connection
   */
  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.rtcConfig)
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signalingService) {
        this.signalingService.sendIceCandidate(event.candidate)
      }
    }
    
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream')
      this.remoteStream = event.streams[0]
      
      if (this.remoteVideoElement) {
        this.remoteVideoElement.srcObject = this.remoteStream
      }
      
      this.updateStatus('Connected')
    }
    
    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState)
      this.updateStatus(`Connection: ${this.peerConnection.connectionState}`)
      
      if (this.peerConnection.connectionState === 'connected') {
        this.updateStatus('Connected')
      } else if (this.peerConnection.connectionState === 'disconnected' || 
                 this.peerConnection.connectionState === 'failed') {
        this.updateStatus('Disconnected')
      }
    }
    
    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream)
      })
    }
    
    return this.peerConnection
  }
  
  /**
   * Initiate a call (caller side)
   */
  async initiateCall() {
    try {
      console.log("Initiating call...")
      
      if (!this.localStream) {
        console.log("Starting local video first...")
        await this.startLocalVideo()
      }
      
      this.isInitiator = true
      this.createPeerConnection()
      
      console.log("Creating offer...")
      // Create and send offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      
      console.log("Setting local description...")
      await this.peerConnection.setLocalDescription(offer)
      
      console.log("Sending offer through signaling service...")
      if (this.signalingService) {
        this.signalingService.sendOffer(offer)
      }
      
      this.updateStatus('Calling...')
    } catch (error) {
      console.error('Error initiating call:', error)
      this.updateStatus('Error initiating call: ' + error.message)
      throw error
    }
  }
  
  /**
   * Handle incoming offer (callee side)
   */
  async handleOffer(offer) {
    try {
      if (!this.localStream) {
        await this.startLocalVideo()
      }
      
      this.isInitiator = false
      this.createPeerConnection()
      
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      
      // Create and send answer
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)
      
      if (this.signalingService) {
        this.signalingService.sendAnswer(answer)
      }
      
      this.updateStatus('Connecting...')
    } catch (error) {
      console.error('Error handling offer:', error)
      this.updateStatus('Error handling call')
    }
  }
  
  /**
   * Handle incoming answer (caller side)
   */
  async handleAnswer(answer) {
    try {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
        this.updateStatus('Connecting...')
      }
    } catch (error) {
      console.error('Error handling answer:', error)
      this.updateStatus('Error connecting')
    }
  }
  
  /**
   * Handle remote ICE candidate
   */
  async handleRemoteIceCandidate(candidate) {
    try {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error)
    }
  }
  
  /**
   * Handle peer left
   */
  handlePeerLeft() {
    this.updateStatus('Peer disconnected')
    this.cleanup()
  }
  
  /**
   * Toggle microphone mute
   */
  toggleMute() {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      this.isMuted = !audioTracks[0]?.enabled
      return this.isMuted
    }
    return false
  }
  
  /**
   * Toggle camera on/off
   */
  toggleCamera() {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      this.isCameraOff = !videoTracks[0]?.enabled
      return this.isCameraOff
    }
    return false
  }
  
  /**
   * Hang up the call
   */
  hangup() {
    this.updateStatus('Hanging up...')
    
    if (this.signalingService) {
      this.signalingService.sendHangup()
    }
    
    this.cleanup()
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
    
    // Clear video elements
    if (this.localVideoElement) {
      this.localVideoElement.srcObject = null
    }
    
    if (this.remoteVideoElement) {
      this.remoteVideoElement.srcObject = null
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
    
    this.remoteStream = null
    this.isInitiator = false
    this.isMuted = false
    this.isCameraOff = false
    
    this.updateStatus('Disconnected')
  }
  
  /**
   * Update status
   */
  updateStatus(status) {
    console.log('WebRTC Status:', status)
    if (this.onStatusChange) {
      this.onStatusChange(status)
    }
  }
}

export default WebRTCClient
