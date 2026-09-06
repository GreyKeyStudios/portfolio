"""Smoke-test the installed Blender MCP server and live Blender bridge."""

import asyncio

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


SERVER = r"C:\Users\titan\.local\bin\blender-mcp.exe"


async def main() -> None:
    parameters = StdioServerParameters(command=SERVER, args=[])
    async with stdio_client(parameters) as (reader, writer):
        async with ClientSession(reader, writer) as session:
            await session.initialize()
            tools = await session.list_tools()
            names = [tool.name for tool in tools.tools]
            print(f"TOOLS {len(names)}")
            print("READ_ONLY_TOOL", "get_blendfile_summary_path_info" in names)
            result = await session.call_tool("get_blendfile_summary_path_info", {})
            print("LIVE_CALL_ERROR", result.isError)
            for item in result.content:
                text = getattr(item, "text", None)
                if text:
                    print(text)


if __name__ == "__main__":
    asyncio.run(main())
