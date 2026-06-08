import server from "../src/server";

export default async function handler(request: Request) {
  return server.fetch(request, undefined, undefined);
}
