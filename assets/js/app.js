// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import "phoenix_html"
// Establish Phoenix Socket and LiveView configuration.
import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import topbar from "../vendor/topbar"

// Import our WebRTC modules
import WebRTCClient from "./webrtc_client"
import SignalingService from "./signaling_service"

const csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")

// WebRTC Hooks for LiveView
const Hooks = {
  WebRTCVideo: {
    mounted() {
      this.webrtcClient = new WebRTCClient()
      this.signalingService = new SignalingService(this.el.dataset.roomId)
      
      // Initialize WebRTC client with signaling service
      this.webrtcClient.initialize(this.signalingService)
      
      // Set up video elements
      this.localVideo = this.el.querySelector('#localVideo')
      this.remoteVideo = this.el.querySelector('#remoteVideo')
      
      if (this.localVideo) {
        this.webrtcClient.setLocalVideoElement(this.localVideo)
      }
      
      if (this.remoteVideo) {
        this.webrtcClient.setRemoteVideoElement(this.remoteVideo)
      }
      
      // Set up control buttons
      this.setupControlButtons()
      
      // Set up status updates
      this.webrtcClient.onStatusChange = (status) => {
        this.updateConnectionStatus(status)
      }
      
      // Auto-start local video for callee page
      if (this.el.dataset.autoStart === "true") {
        this.startLocalVideo()
      }
    },
    
    setupControlButtons() {
      const muteBtn = this.el.querySelector('#muteBtn')
      const cameraBtn = this.el.querySelector('#cameraBtn')
      const callBtn = this.el.querySelector('#callBtn')
      const hangupBtn = this.el.querySelector('#hangupBtn')
      
      if (muteBtn) {
        muteBtn.addEventListener('click', () => {
          const isMuted = this.webrtcClient.toggleMute()
          muteBtn.classList.toggle('muted', isMuted)
          muteBtn.innerHTML = isMuted ? '🔇' : '🔊'
        })
      }
      
      if (cameraBtn) {
        cameraBtn.addEventListener('click', () => {
          const isDisabled = this.webrtcClient.toggleCamera()
          cameraBtn.classList.toggle('disabled', isDisabled)
          cameraBtn.innerHTML = isDisabled ? '📷' : '📹'
        })
      }
      
      if (callBtn) {
        callBtn.addEventListener('click', () => {
          this.startCall()
        })
      }
      
      if (hangupBtn) {
        hangupBtn.addEventListener('click', () => {
          this.hangup()
        })
      }
    },
    
    async startLocalVideo() {
      try {
        await this.webrtcClient.startLocalVideo()
        this.updateConnectionStatus('Ready')
      } catch (error) {
        console.error('Error starting local video:', error)
        this.updateConnectionStatus('Error: ' + error.message)
      }
    },
    
    async startCall() {
      try {
        await this.startLocalVideo()
        await this.webrtcClient.initiateCall()
        this.updateConnectionStatus('Calling...')
      } catch (error) {
        console.error('Error starting call:', error)
        this.updateConnectionStatus('Error: ' + error.message)
      }
    },
    
    hangup() {
      this.webrtcClient.hangup()
      this.updateConnectionStatus('Disconnected')
    },
    
    updateConnectionStatus(status) {
      const statusEl = this.el.querySelector('.connection-status')
      if (statusEl) {
        statusEl.textContent = status
        statusEl.className = 'connection-status'
        
        if (status.includes('Connected')) {
          statusEl.classList.add('status-connected')
        } else if (status.includes('Calling') || status.includes('Connecting')) {
          statusEl.classList.add('status-connecting')
        } else {
          statusEl.classList.add('status-disconnected')
        }
      }
    },
    
    destroyed() {
      if (this.webrtcClient) {
        this.webrtcClient.cleanup()
      }
      if (this.signalingService) {
        this.signalingService.disconnect()
      }
    }
  }
}

const liveSocket = new LiveSocket("/live", Socket, {
  longPollFallbackMs: 2500,
  params: {_csrf_token: csrfToken},
  hooks: Hooks,
})

// Show progress bar on live navigation and form submits
topbar.config({barColors: {0: "#29d"}, shadowColor: "rgba(0, 0, 0, .3)"})
window.addEventListener("phx:page-loading-start", _info => topbar.show(300))
window.addEventListener("phx:page-loading-stop", _info => topbar.hide())

// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket

// The lines below enable quality of life phoenix_live_reload
// development features:
//
//     1. stream server logs to the browser console
//     2. click on elements to jump to their definitions in your code editor
//
if (process.env.NODE_ENV === "development") {
  window.addEventListener("phx:live_reload:attached", ({detail: reloader}) => {
    // Enable server log streaming to client.
    // Disable with reloader.disableServerLogs()
    reloader.enableServerLogs()

    // Open configured PLUG_EDITOR at file:line of the clicked element's HEEx component
    //
    //   * click with "c" key pressed to open at caller location
    //   * click with "d" key pressed to open at function component definition location
    let keyDown
    window.addEventListener("keydown", e => keyDown = e.key)
    window.addEventListener("keyup", e => keyDown = null)
    window.addEventListener("click", e => {
      if(keyDown === "c"){
        e.preventDefault()
        e.stopImmediatePropagation()
        reloader.openEditorAtCaller(e.target)
      } else if(keyDown === "d"){
        e.preventDefault()
        e.stopImmediatePropagation()
        reloader.openEditorAtDef(e.target)
      }
    }, true)

    window.liveReloader = reloader
  })
}

