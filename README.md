# Elixir Live Stream - WebRTC Video Meeting Application

A real-time video meeting application built with Elixir, Phoenix, and WebRTC, similar to Google Meet. This application provides peer-to-peer video calling functionality with a clean, Bootstrap-based interface.

## Features

- **Peer-to-Peer Video Calling**: Direct WebRTC connections between users
- **Real-time Signaling**: Phoenix Channels for WebRTC signaling
- **Room-based Meetings**: Create and join video meeting rooms
- **Media Controls**: Toggle camera and microphone on/off
- **Responsive Design**: Bootstrap-powered UI that works on desktop and mobile
- **Clean Architecture**: Modular design with reusable components

## Technology Stack

- **Backend**: Elixir + Phoenix Framework
- **Frontend**: Phoenix LiveView + Bootstrap 5
- **WebRTC**: For peer-to-peer video communication
- **Signaling**: Phoenix Channels with WebSocket
- **STUN Server**: Google's free STUN server for NAT traversal
- **Icons**: Font Awesome 6
- **CSS Framework**: Bootstrap 5.3.2

## Quick Start

To start your Phoenix server:

* Run `mix setup` to install and setup dependencies
* Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

## Usage

### Creating a New Meeting

1. Go to the home page (`http://localhost:4000`)
2. Click "Create Room"
3. You'll be redirected to the caller page with a unique room ID
4. Share the room ID with other participants

### Joining an Existing Meeting

1. Go to the home page (`http://localhost:4000`)
2. Enter the room ID in the "Join Existing Meeting" field
3. Click "Join Room"
4. You'll be redirected to the callee page

### During a Call

- **Start Call**: Click the green phone button (caller only)
- **Toggle Microphone**: Click the microphone button
- **Toggle Camera**: Click the video button
- **End Call**: Click the red phone button
- **Leave Room**: Click the exit button

## Architecture

### Backend Components

1. **WebRTC Channel** - Handles WebRTC signaling (offers, answers, ICE candidates)
2. **User Socket** - WebSocket connection handler
3. **Room Controller** - Handles room creation and joining
4. **Presence Module** - Tracks users in rooms

### Frontend Components

1. **WebRTC Client** - Manages WebRTC peer connections and media streams
2. **Signaling Service** - Communicates with Phoenix Channels
3. **Phoenix LiveView Hooks** - Integrates WebRTC with Phoenix LiveView

## WebRTC Configuration

The application uses Google's free STUN servers for NAT traversal:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

## Browser Compatibility

- Chrome 80+
- Firefox 72+
- Safari 13+
- Edge 80+

WebRTC requires HTTPS in production environments.

## Learn more

* Official website: https://www.phoenixframework.org/
* Guides: https://hexdocs.pm/phoenix/overview.html
* Docs: https://hexdocs.pm/phoenix
* Forum: https://elixirforum.com/c/phoenix-forum
* Source: https://github.com/phoenixframework/phoenix
