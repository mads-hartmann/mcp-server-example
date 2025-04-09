import express from "express";
import cors from "cors";
import type { NextFunction, Request, Response } from "express";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

type Greeting = {
  name: string;
  greeting: string;
};

const greetings: Greeting[] = [
  {
    name: "Mads",
    greeting: "Halløj Mads!",
  },
  {
    name: "Filip",
    greeting: "Ahoj Filip",
  },
];

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", {
    list: (_extra) => {
      return {
        resources: greetings.map((greeting) => ({
          name: greeting.name,
          uri: `greeting://${greeting.name}`,
          description: `A greeting resource for ${greeting.name}`,
          mimeType: "text/plain",
        })),
      };
    },
  }),
  async (uri, { name }) => {
    const greeting = greetings.find((greeting) => greeting.name === name);
    if (!greeting) {
      throw new Error(`Greeting for ${name} not found`);
    }
    return {
      contents: [
        {
          uri: uri.href,
          text: greeting.greeting,
        },
      ],
    };
  }
);

const app = express();

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: { [sessionId: string]: SSEServerTransport } = {};

app.use(cors());

app.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

app.listen(3001);
