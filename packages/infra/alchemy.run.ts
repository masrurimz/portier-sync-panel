import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });

const app = await alchemy("portier-sync", { profile: "zahid" });

export const web = await TanStackStart("web", {
  cwd: "../../apps/web",
  adopt: true,
  domains: [{
    domainName: "portier-sync-test.zahid.es",
    zoneId: "e9f90134dc154581fd097e6b1783ad94",
  }],
  bindings: {
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
  },
});

console.log(`Web    -> ${web.url}`);

await app.finalize();
