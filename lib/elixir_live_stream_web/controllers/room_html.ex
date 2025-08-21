defmodule ElixirLiveStreamWeb.RoomHTML do
  @moduledoc """
  This module contains pages rendered by RoomController.
  """

  use ElixirLiveStreamWeb, :html

  embed_templates "room_html/*"
end
