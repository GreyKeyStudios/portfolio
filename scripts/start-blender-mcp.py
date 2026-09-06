"""Start Blender's official MCP bridge after the interactive UI is ready.

Launch Blender with this script and ``--online-mode``. The online-mode flag is
limited to that Blender process, so the global Blender privacy preference does
not need to be changed.
"""

import bpy


def start_mcp_bridge() -> None:
    result = bpy.ops.blmcp.server_start()
    print(f"MCP_START_RESULT {result}")


bpy.app.timers.register(start_mcp_bridge, first_interval=1.0)
