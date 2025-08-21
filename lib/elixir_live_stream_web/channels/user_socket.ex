defmodule ElixirLiveStreamWeb.UserSocket do
  @moduledoc """
  User Socket for handling WebSocket connections.

  This socket handles WebRTC signaling channels and other real-time features.
  """

  use Phoenix.Socket

  # Channels
  channel "webrtc:*", ElixirLiveStreamWeb.WebRTCChannel

  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  # To deny connection, return `:error` or `{:error, term}`.
  # To control the response when denying connection, return
  # `{:error, %{reason: term}}`.
  @impl true
  def connect(_params, socket, _connect_info) do
    # For now, allow all connections
    # In production, you might want to authenticate users here
    {:ok, socket}
  end

  # Socket IDs are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     Elixir.LiveStreamWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  @impl true
  def id(_socket), do: nil
end
