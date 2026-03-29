import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { packageDirectorySync } from "package-directory";

const enableCache = process.env.APSRT_ENABLE_CACHE !== "false";
const cacheDirectory = "node_modules/.apsrt/";
const cacheFileName = "tsmorphCache.json";
let cache: Record<string, any> = {};

const getCachePath = () => {
  const packageDirectory = packageDirectorySync();
  if (!packageDirectory) {
    throw new Error("Could not find package root");
  }

  const cacheDirectoryPath = resolve(packageDirectory, cacheDirectory);
  const cachePath = resolve(packageDirectory, cacheDirectory, cacheFileName);

  return { cacheDirectoryPath, cachePath };
};

export const getCache = (cacheKey: string) => {
  if (!enableCache) {
    return null;
  }

  // Get file last modified time
  const mtime = statSync(cacheKey).mtimeMs;

  // Get memory cache
  let cached = cache[cacheKey];

  const { cachePath } = getCachePath();

  // Load cache from disk if not in memory
  if (!cached && existsSync(cachePath)) {
    console.log(`Loading cache from disk: ${cachePath}`);
    cache = JSON.parse(readFileSync(cachePath, "utf8"));
  }

  cached = cache[cacheKey];

  // Check if cached and valid
  if (cached && cached.mtime === mtime) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached.data;
  } else {
    console.log(`Cache miss for ${cacheKey}`);
  }

  return null;
};

export const setCache = (cacheKey: string, data: unknown) => {
  if (!enableCache) {
    return;
  }
  const { cachePath, cacheDirectoryPath } = getCachePath();
  const mtime = statSync(cacheKey).mtimeMs;

  cache[cacheKey] = { mtime, data };

  mkdirSync(cacheDirectoryPath, { recursive: true });

  writeFileSync(cachePath, JSON.stringify(cache, null, 2));
};
