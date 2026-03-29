import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import type { AnalysisCache, AnalysisCacheRecord, SourceFileAnalysis } from "./types";

const DEFAULT_CACHE_DIRECTORY = ".apsrt";
const DEFAULT_CACHE_FILE_NAME = "analysis-cache.json";

export interface CreateAnalysisCacheOptions {
  enabled?: boolean;
  rootDir?: string;
  cacheFilePath?: string;
}

export function createAnalysisCache(
  options: CreateAnalysisCacheOptions = {}
): AnalysisCache {
  const enabled = options.enabled ?? process.env.APSRT_ENABLE_CACHE !== "false";
  const rootDir = options.rootDir ?? process.cwd();
  const cacheFilePath =
    options.cacheFilePath ??
    resolve(rootDir, DEFAULT_CACHE_DIRECTORY, DEFAULT_CACHE_FILE_NAME);

  let memoryCache: AnalysisCacheRecord = {};

  const loadFromDisk = () => {
    if (!existsSync(cacheFilePath)) {
      return;
    }

    memoryCache = JSON.parse(
      readFileSync(cacheFilePath, "utf8")
    ) as AnalysisCacheRecord;
  };

  return {
    get(cacheKey: string): SourceFileAnalysis | null {
      if (!enabled) {
        return null;
      }

      const mtimeMs = statSync(cacheKey).mtimeMs;

      if (!memoryCache[cacheKey]) {
        loadFromDisk();
      }

      const cachedEntry = memoryCache[cacheKey];
      if (!cachedEntry || cachedEntry.mtimeMs !== mtimeMs) {
        return null;
      }

      return cachedEntry.data;
    },

    set(cacheKey: string, data: SourceFileAnalysis) {
      if (!enabled) {
        return;
      }

      memoryCache[cacheKey] = {
        mtimeMs: statSync(cacheKey).mtimeMs,
        data,
      };

      mkdirSync(dirname(cacheFilePath), { recursive: true });
      writeFileSync(cacheFilePath, JSON.stringify(memoryCache, null, 2));
    },

    getCacheFilePath() {
      return cacheFilePath;
    },
  };
}

export const analysisCache = createAnalysisCache();
