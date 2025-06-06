import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// url: https://3001--019616f6-7429-7224-9a00-89e594484139.eu01.gitpod.dev
// url: http://localhost:3001/sse

const url = "http://localhost:3001/sse";

const transport = new SSEClientTransport(new URL(url));

const client = new Client({
  name: "example-client",
  version: "1.0.0",
});

await client.connect(transport);

const templates = await client.listResourceTemplates();
console.log("Found templates:", templates.resourceTemplates.length);
for (const template of templates.resourceTemplates) {
  console.log("Found template:", template.name);
}

// List resources
const resources = await client.listResources();
for (const resource of resources.resources) {
  console.log("Found resource:", resource.name);
}

const resource = await client.readResource({ uri: "greeting://Mads" });
console.log(resource);

client.close();
