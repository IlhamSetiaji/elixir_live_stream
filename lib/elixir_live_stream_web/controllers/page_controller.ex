defmodule ElixirLiveStreamWeb.PageController do
  use ElixirLiveStreamWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
