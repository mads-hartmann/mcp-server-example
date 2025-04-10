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

type Issue = {
  name: string;
  description: string;
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

const issues: Issue[] = [
  {
    name: "NEXT-123",
    description:
      "We have an issue with our drop-downs where the icon that triggers the dropdown doesn't preverse it's hover status when you click it and it activates the dropdown",
  },
  {
    name: "NEXT-456",
    description:
      "We have an issue with how we handle our context menus. When you e.g. right click an environment in the sidebar, then we don't maintain the hover state of the environment you clicked, which makes the whole thing feel off. ",
  },
];

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

// Add a dynamic greeting resource
server.resource(
  "issue",
  new ResourceTemplate("issue://{name}", {
    list: (_extra) => {
      return {
        resources: issues.map((issue) => ({
          name: issue.name,
          uri: `issue://${issue.name}`,
          description: `${issue.name}`,
          mimeType: "text/plain",
        })),
      };
    },
  }),
  async (uri, { name }) => {
    const issue = issues.find((issue) => issue.name === name);
    if (!issue) {
      throw new Error(`Issue for ${name} not found`);
    }
    return {
      contents: [
        {
          uri: uri.href,
          text: issue.description,
        },
      ],
    };
  }
);

server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", {
    list: (_extra) => {
      return {
        resources: greetings.map((greeting) => ({
          name: greeting.name,
          uri: `greeting://${greeting.name}`,
          description: `${greeting.name}`,
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
