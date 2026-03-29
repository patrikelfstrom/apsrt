import { createServer, createLogger, type InlineConfig, type Logger } from "vite";
import { ModuleCacheMap, ViteNodeRunner } from "vite-node/client";
import { ViteNodeServer } from "vite-node/server";

export interface ProjectModuleLoader {
  importModule(modulePath: string): Promise<Record<string, unknown>>;
  close(): Promise<void>;
}

export async function createProjectModuleLoader(
  cwd: string
): Promise<ProjectModuleLoader> {
  const viteLogger = createApsrtViteLogger();
  const viteServer = await createServer({
    root: cwd,
    appType: "custom",
    clearScreen: false,
    logLevel: "error",
    customLogger: viteLogger,
    server: {
      middlewareMode: true,
      hmr: false,
    },
  } satisfies InlineConfig);

  const viteNodeServer = new ViteNodeServer(viteServer);
  const runner = new ViteNodeRunner({
    root: viteServer.config.root,
    base: viteServer.config.base,
    moduleCache: new ModuleCacheMap(),
    fetchModule: (id) => viteNodeServer.fetchModule(id),
    resolveId: (id, importer) => viteNodeServer.resolveId(id, importer),
  });

  return {
    async importModule(modulePath: string) {
      return (await runner.executeFile(modulePath)) as Record<string, unknown>;
    },
    async close() {
      await viteServer.close();
    },
  };
}

function createApsrtViteLogger(): Logger {
  const baseLogger = createLogger("error", {
    prefix: "[apsrt]",
    allowClearScreen: false,
  });

  return {
    ...baseLogger,
    error(message, options) {
      const text = String(message);

      if (text.includes("WebSocket server error")) {
        return;
      }

      baseLogger.error(message, options);
    },
  };
}
