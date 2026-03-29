import { relative } from "node:path";
import { Node, Project, SyntaxKind, type SourceFile } from "ts-morph";
import { analysisCache } from "./analysisCache";
import { createLikelyNondeterministicFunctionError } from "./errors";
import { findTsConfigPath } from "./loadTsConfig";
import { createProjectModuleLoader } from "./projectModuleLoader";
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

interface SourceFileScanResult {
  sourceFilePath: string;
  analysis: SourceFileAnalysis;
  nondeterministicLocations: string[];
}

export const analyzeProjectSources = async (
  sourceFilePaths: string[],
  options: AnalyzeProjectSourcesOptions = {}
): Promise<AnalyzedProjectSource[]> => {
  const tsConfigFilePath = findTsConfigPath(options);
  const cache = options.cache ?? analysisCache;
  const displayRoot = options.cwd ?? process.cwd();

  const project = new Project({
    tsConfigFilePath,
    skipFileDependencyResolution: true,
    skipAddingFilesFromTsConfig: true,
  });

  const scannedSourceFiles = sourceFilePaths.map((sourceFilePath) => {
    const sourceFile =
      project.getSourceFile(sourceFilePath) ??
      project.addSourceFileAtPath(sourceFilePath);

    const cachedAnalysis = cache.get(sourceFilePath);
    if (cachedAnalysis) {
      return {
        sourceFilePath,
        analysis: cachedAnalysis,
        nondeterministicLocations: [],
      } satisfies SourceFileScanResult;
    }

    const scanResult = analyzeSourceFile(sourceFile, displayRoot);
    if (scanResult.nondeterministicLocations.length === 0) {
      cache.set(sourceFilePath, scanResult.analysis);
    }

    return {
      sourceFilePath,
      analysis: scanResult.analysis,
      nondeterministicLocations: scanResult.nondeterministicLocations,
    } satisfies SourceFileScanResult;
  });

  const nondeterministicLocations = scannedSourceFiles.flatMap(
    (scanResult) => scanResult.nondeterministicLocations
  );

  if (nondeterministicLocations.length > 0) {
    throw createLikelyNondeterministicFunctionError(nondeterministicLocations);
  }

  const moduleLoader = await createProjectModuleLoader(displayRoot);

  try {
    return await Promise.all(
      scannedSourceFiles.map(async ({ sourceFilePath, analysis }) => {
        const moduleExports = await moduleLoader.importModule(sourceFilePath);

        return { sourceFilePath, analysis, moduleExports };
      })
    );
  } finally {
    await moduleLoader.close();
  }
};

function analyzeSourceFile(
  sourceFile: SourceFile,
  displayRoot: string
): {
  analysis: SourceFileAnalysis;
  nondeterministicLocations: string[];
} {
  const nondeterministicLocations: string[] = [];
  const exportedFunctions = sourceFile
    .getFunctions()
    .filter((functionDeclaration) => functionDeclaration.isExported())
    .map<ExportedFunctionAnalysis | null>((functionDeclaration) => {
      const name = functionDeclaration.getName();
      if (!name) {
        return null;
      }

      if (hasIgnoreAnnotation(functionDeclaration)) {
        return null;
      }

      if (isLikelyNondeterministic(functionDeclaration.getText())) {
        const location = toDisplayLocation(
          sourceFile.getFilePath(),
          functionDeclaration.getStartLineNumber(),
          displayRoot
        );
        nondeterministicLocations.push(location);
        return null;
      }

      const location = getNodeLocation(
        functionDeclaration.getNameNode() ?? functionDeclaration
      );
      return {
        name,
        lineNumber: location.line,
        columnNumber: location.column,
        parameterTypes: functionDeclaration
          .getParameters()
          .map((parameter) => parameter.getType().getText()),
      };
    });

  const exportedVariableFunctions = sourceFile
    .getVariableStatements()
    .filter((statement) => statement.isExported())
    .flatMap((statement) =>
      statement
        .getDeclarations()
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

          if (
            !Node.isArrowFunction(initializer) &&
            !Node.isFunctionExpression(initializer)
          ) {
            return null;
          }

          if (hasIgnoreAnnotation(statement, declaration, initializer)) {
            return null;
          }

          if (isLikelyNondeterministic(declaration.getText())) {
            const location = toDisplayLocation(
              sourceFile.getFilePath(),
              declaration.getStartLineNumber(),
              displayRoot
            );
            nondeterministicLocations.push(location);
            return null;
          }

          const location = getNodeLocation(declaration.getNameNode());
          return {
            name: declaration.getName(),
            lineNumber: location.line,
            columnNumber: location.column,
            parameterTypes: initializer
              .getParameters()
              .map((parameter) => parameter.getType().getText()),
          };
        })
    );

  return {
    analysis: {
      functions: [...exportedFunctions, ...exportedVariableFunctions].filter(
        (functionAnalysis): functionAnalysis is ExportedFunctionAnalysis =>
          functionAnalysis !== null
      ),
    },
    nondeterministicLocations,
  };
}

function hasIgnoreAnnotation(
  ...nodes: Array<{
    getJsDocs?: () => Array<{ getTags(): Array<{ getTagName(): string }> }>;
    getLeadingCommentRanges?: () => Array<{ getText(): string }>;
  }>
) {
  return nodes.some((node) => {
    const hasJSDocTag =
      node.getJsDocs?.().some((doc) =>
        doc.getTags().some((tag) => tag.getTagName() === "apsrt-ignore")
      ) ?? false;

    const hasLeadingCommentTag =
      node.getLeadingCommentRanges?.().some((commentRange) =>
        commentRange.getText().includes("@apsrt-ignore")
      ) ?? false;

    return hasJSDocTag || hasLeadingCommentTag;
  });
}

function isLikelyNondeterministic(functionText: string) {
  return [
    "Math.random(",
    "Date.now(",
    "new Date(",
    "crypto.randomUUID(",
  ].some((pattern) => functionText.includes(pattern));
}

function toDisplayLocation(
  filePath: string,
  lineNumber: number,
  displayRoot: string
) {
  const displayPath = relative(displayRoot, filePath) || ".";
  return `${displayPath}:${lineNumber}`;
}

function getNodeLocation(node: Node) {
  return node.getSourceFile().getLineAndColumnAtPos(node.getStart());
}
