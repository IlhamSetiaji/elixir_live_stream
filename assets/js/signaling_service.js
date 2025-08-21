/**
 * Signaling Service for WebRTC using Phoenix Channels
 * Handles communication between peers for call setup
 */
class SignalingService {
  constructor(roomId) {
    this.roomId = roomId
    this.socket = null
    this.channel = null
    this.isConnected = false
    
    // Event handlers
    this.onOffer = null
    this.onAnswer = null
    this.onIceCandidate = null
    this.onPeerJoined = null
    this.onPeerLeft = null
    this.onConnected = null
    this.onDisconnected = null
    
    this.initializeSocket()
  }
  
  /**
   * Initialize Phoenix socket connection
   */
  initializeSocket() {
    // Get the socket from the LiveView app
    if (window.liveSocket && window.liveSocket.socket) {
      this.socket = window.liveSocket.socket
      this.joinChannel()
    } else {
      // Fallback: create new socket connection
      const socketProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const socketUrl = `${socketProtocol}//${window.location.host}/socket`
      
      import("phoenix").then(({ Socket }) => {
        this.socket = new Socket(socketUrl, {
          params: { token: this.getCSRFToken() }
        })
        
        this.socket.connect()
        this.joinChannel()
      })
    }
  }
  
  /**
   * Join the signaling channel for the room
   */
  joinChannel() {
    if (!this.socket || !this.roomId) return
    
    this.channel = this.socket.channel(`webrtc:${this.roomId}`, {})
    
    // Handle channel events
    this.channel.on("offer", (payload) => {
      console.log("Received offer:", payload)
      if (this.onOffer) {
        this.onOffer(payload.offer)
      }
    })
    
    this.channel.on("answer", (payload) => {
      console.log("Received answer:", payload)
      if (this.onAnswer) {
        this.onAnswer(payload.answer)
      }
    })
    
    this.channel.on("ice_candidate", (payload) => {
      console.log("Received ICE candidate:", payload)
      if (this.onIceCandidate) {
        this.onIceCandidate(payload.candidate)
      }
    })
    
    this.channel.on("peer_joined", (payload) => {
      console.log("Peer joined:", payload)
      if (this.onPeerJoined) {
        this.onPeerJoined(payload)
      }
    })
    
    this.channel.on("peer_left", (payload) => {
      console.log("Peer left:", payload)
      if (this.onPeerLeft) {
        this.onPeerLeft(payload)
      }
    })
    
    this.channel.on("hangup", (payload) => {
      console.log("Peer hung up:", payload)
      if (this.onPeerLeft) {
        this.onPeerLeft(payload)
      }
    })
    
    // Join the channel
    this.channel.join()
      .receive("ok", (resp) => {
        console.log("Joined signaling channel successfully", resp)
        this.isConnected = true
        if (this.onConnected) {
          this.onConnected(resp)
        }
      })
      .receive("error", (resp) => {
        console.log("Unable to join signaling channel", resp)
        if (this.onDisconnected) {
          this.onDisconnected(resp)
        }
      })
  }
  
  /**
   * Send offer to the signaling server
   */
  sendOffer(offer) {
    if (this.channel && this.isConnected) {
      this.channel.push("offer", { offer: offer })
        .receive("ok", (resp) => {
          console.log("Offer sent successfully", resp)
        })
        .receive("error", (resp) => {
          console.error("Error sending offer", resp)
        })
    }
  }
  
  /**
   * Send answer to the signaling server
   */
  sendAnswer(answer) {
    if (this.channel && this.isConnected) {
      this.channel.push("answer", { answer: answer })
        .receive("ok", (resp) => {
          console.log("Answer sent successfully", resp)
        })
        .receive("error", (resp) => {
          console.error("Error sending answer", resp)
        })
    }
  }
  
  /**
   * Send ICE candidate to the signaling server
   */
  sendIceCandidate(candidate) {
    if (this.channel && this.isConnected) {
      this.channel.push("ice_candidate", { candidate: candidate })
        .receive("ok", (resp) => {
          console.log("ICE candidate sent successfully", resp)
        })
        .receive("error", (resp) => {
          console.error("Error sending ICE candidate", resp)
        })
    }
  }
  
  /**
   * Send hangup signal to the signaling server
   */
  sendHangup() {
    if (this.channel && this.isConnected) {
      this.channel.push("hangup", {})
        .receive("ok", (resp) => {
          console.log("Hangup sent successfully", resp)
        })
        .receive("error", (resp) => {
          console.error("Error sending hangup", resp)
        })
    }
  }
  
  /**
   * Get presence information for the room
   */
  getPresence() {
    if (this.channel && this.isConnected) {
      this.channel.push("get_presence", {})
        .receive("ok", (resp) => {
          console.log("Presence info:", resp)
          return resp.presence
        })
        .receive("error", (resp) => {
          console.error("Error getting presence", resp)
        })
    }
  }
  
  /**
   * Disconnect from the signaling service
   */
  disconnect() {
    if (this.channel) {
      this.channel.leave()
      this.channel = null
    }
    
    this.isConnected = false
    
    if (this.onDisconnected) {
      this.onDisconnected()
    }
  }
  
  /**
   * Get CSRF token from meta tag
   */
  getCSRFToken() {
    const csrfToken = document.querySelector("meta[name='csrf-token']")
    return csrfToken ? csrfToken.getAttribute("content") : null
  }
  
  /**
   * Check if connected to signaling service
   */
  isSignalingConnected() {
    return this.isConnected && this.channel
  }
}

export default SignalingService
