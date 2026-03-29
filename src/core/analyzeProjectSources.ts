import { pathToFileURL } from "node:url";
import { Node, Project, SyntaxKind, type SourceFile } from "ts-morph";
import { analysisCache } from "./analysisCache";
import { findTsConfigPath } from "./loadTsConfig";
import type {
  AnalysisCache,
  AnalyzedProjectSource,
  ExportedFunctionAnalysis,
  SourceFileAnalysis,
  TsConfigLookupOptions,
} from "./types";

export interface AnalyzeProjectSourcesOptions extends TsConfigLookupOptions {
  cache?: AnalysisCache;
}

export const analyzeProjectSources = async (
  sourceFilePaths: string[],
  options: AnalyzeProjectSourcesOptions = {}
): Promise<AnalyzedProjectSource[]> => {
  const tsConfigFilePath = findTsConfigPath(options);
  const cache = options.cache ?? analysisCache;

  const project = new Project({
    tsConfigFilePath,
    skipFileDependencyResolution: true,
    skipAddingFilesFromTsConfig: true,
  });

  return Promise.all(
    sourceFilePaths.map(async (sourceFilePath) => {
      const sourceFile =
        project.getSourceFile(sourceFilePath) ??
        project.addSourceFileAtPath(sourceFilePath);

      const cachedAnalysis = cache.get(sourceFilePath);
      const analysis = cachedAnalysis ?? analyzeSourceFile(sourceFile);

      if (!cachedAnalysis) {
        cache.set(sourceFilePath, analysis);
      }

      const moduleExports = (await import(
        pathToFileURL(sourceFilePath).href
      )) as Record<string, unknown>;

      return { sourceFilePath, analysis, moduleExports };
    })
  );
};

function analyzeSourceFile(sourceFile: SourceFile): SourceFileAnalysis {
  const exportedFunctions = sourceFile
    .getFunctions()
    .filter((functionDeclaration) => functionDeclaration.isExported())
    .map<ExportedFunctionAnalysis | null>((functionDeclaration) => {
      const name = functionDeclaration.getName();
      if (!name) {
        return null;
      }

      return {
        name,
        parameterTypes: functionDeclaration
          .getParameters()
          .map((parameter) => parameter.getType().getText()),
      };
    });

  const exportedVariableFunctions = sourceFile
    .getVariableStatements()
    .filter((statement) => statement.isExported())
    .flatMap((statement) => statement.getDeclarations())
    .map<ExportedFunctionAnalysis | null>((declaration) => {
      const initializer = declaration.getInitializer();
      if (
        !initializer ||
        !(
          initializer.getKind() === SyntaxKind.ArrowFunction ||
          initializer.getKind() === SyntaxKind.FunctionExpression
        )
      ) {
        return null;
      }

      if (!Node.isArrowFunction(initializer) && !Node.isFunctionExpression(initializer)) {
        return null;
      }

      return {
        name: declaration.getName(),
        parameterTypes: initializer
          .getParameters()
          .map((parameter) => parameter.getType().getText()),
      };
    });

  return {
    functions: [...exportedFunctions, ...exportedVariableFunctions].filter(
      (functionAnalysis): functionAnalysis is ExportedFunctionAnalysis =>
        functionAnalysis !== null
    ),
  };
}
