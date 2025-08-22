defmodule ElixirLiveStreamWeb.WebRTCChannel do
  @moduledoc """
  WebRTC Channel for handling signaling between peers.

  This channel manages the signaling process for WebRTC peer-to-peer connections.
  It handles offers, answers, ICE candidates, and presence tracking.
  """

  use ElixirLiveStreamWeb, :channel

  alias ElixirLiveStreamWeb.Presence

  @impl true
  def join("webrtc:" <> room_id, _payload, socket) do
    # Track user presence in the room
    send(self(), :after_join)

    socket =
      socket
      |> assign(:room_id, room_id)
      |> assign(:user_id, generate_user_id())

    {:ok, %{room_id: room_id}, socket}
  end

  @impl true
  def handle_info(:after_join, socket) do
    user_id = socket.assigns.user_id

    # Track presence
    {:ok, _} = Presence.track(socket, user_id, %{
      online_at: inspect(System.system_time(:second)),
      joined_at: inspect(System.system_time(:second))
    })

    # Get current presence list
    present_users = Presence.list(socket)
    user_count = map_size(present_users)

    IO.puts("User #{user_id} joined room #{socket.assigns.room_id}. Total users: #{user_count}")

    # Notify ALL users (including the new one) about the peer joining
    broadcast!(socket, "peer_joined", %{
      user_id: user_id,
      user_count: user_count,
      present_users: present_users
    })

    # Send current presence list to the new user
    push(socket, "presence_state", %{
      presence: present_users,
      user_count: user_count
    })

    {:noreply, socket}
  end

  @impl true
  def handle_in("offer", %{"offer" => offer}, socket) do
    # Broadcast offer to all other users in the room
    broadcast_from!(socket, "offer", %{
      offer: offer,
      from: socket.assigns.user_id
    })

    {:reply, :ok, socket}
  end

  @impl true
  def handle_in("answer", %{"answer" => answer}, socket) do
    # Broadcast answer to all other users in the room
    broadcast_from!(socket, "answer", %{
      answer: answer,
      from: socket.assigns.user_id
    })

    {:reply, :ok, socket}
  end

  @impl true
  def handle_in("ice_candidate", %{"candidate" => candidate}, socket) do
    # Broadcast ICE candidate to all other users in the room
    broadcast_from!(socket, "ice_candidate", %{
      candidate: candidate,
      from: socket.assigns.user_id
    })

    {:reply, :ok, socket}
  end

  @impl true
  def handle_in("hangup", _params, socket) do
    # Broadcast hangup to all other users in the room
    broadcast_from!(socket, "hangup", %{
      from: socket.assigns.user_id
    })

    {:reply, :ok, socket}
  end

  @impl true
  def handle_in("get_presence", _params, socket) do
    presence = Presence.list(socket)
    {:reply, {:ok, %{presence: presence}}, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    # Notify others that peer left
    broadcast_from!(socket, "peer_left", %{
      user_id: socket.assigns.user_id
    })

    :ok
  end

  # Private functions

  defp generate_user_id do
    :crypto.strong_rand_bytes(16) |> Base.encode64()
  end
end
