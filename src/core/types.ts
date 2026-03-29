export interface ExportedFunctionAnalysis {
  name: string;
  parameterTypes: string[];
}

export interface SourceFileAnalysis {
  functions: ExportedFunctionAnalysis[];
}

export interface AnalysisCacheEntry {
  mtimeMs: number;
  data: SourceFileAnalysis;
}

export type AnalysisCacheRecord = Record<string, AnalysisCacheEntry>;

export interface AnalysisCache {
  get(cacheKey: string): SourceFileAnalysis | null;
  set(cacheKey: string, data: SourceFileAnalysis): void;
  getCacheFilePath(): string;
}

export interface AnalyzedProjectSource {
  sourceFilePath: string;
  analysis: SourceFileAnalysis;
  moduleExports: Record<string, unknown>;
}

export interface TsConfigLookupOptions {
  cwd?: string;
  configName?: string;
  tsConfigFilePath?: string;
}

export interface RuntimeCliOptions {
  cwd: string;
  tsConfigFilePath?: string;
  updateSnapshots: boolean;
  watch: boolean;
}
