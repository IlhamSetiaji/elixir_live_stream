defmodule ElixirLiveStreamWeb.RoomController do
  @moduledoc """
  Controller for handling room creation and joining.
  """

  use ElixirLiveStreamWeb, :controller

  def index(conn, _params) do
    render(conn, :index, page_title: "Video Meeting - Join or Create Room")
  end

  def create_room(conn, _params) do
    room_id = generate_room_id()
    redirect(conn, to: ~p"/room/#{room_id}/caller")
  end

  def join_room(conn, %{"room_id" => room_id}) do
    redirect(conn, to: ~p"/room/#{room_id}/callee")
  end

  def caller(conn, %{"room_id" => room_id}) do
    render(conn, :caller, room_id: room_id, page_title: "Video Meeting - Caller")
  end

  def callee(conn, %{"room_id" => room_id}) do
    render(conn, :callee, room_id: room_id, page_title: "Video Meeting - Callee")
  end

  defp generate_room_id do
    :crypto.strong_rand_bytes(8) |> Base.encode32(case: :lower, padding: false)
  end
end
