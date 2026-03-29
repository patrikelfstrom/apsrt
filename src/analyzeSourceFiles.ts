import { Project, SyntaxKind, Node, type SourceFile } from "ts-morph";
import { getTsConfigFilePath } from "./getTsConfig";
import { getCache, setCache } from "./cache";

export const analyzeSourceFiles = (sourceFiles: string[]) => {
  const tsConfigFilePath = getTsConfigFilePath();

  const project = new Project({
    tsConfigFilePath,
    skipFileDependencyResolution: true,
    skipAddingFilesFromTsConfig: true,
  });

  return Promise.all(
    sourceFiles.map(async (sourceFilePath) => {
      const sourceFile =
        project.getSourceFile(sourceFilePath) ||
        project.addSourceFileAtPath(sourceFilePath);

      let analyzedSourceFile = getCache(sourceFilePath);

      if (!analyzedSourceFile) {
        analyzedSourceFile = analyzeSourceFile(sourceFile);
      }

      setCache(sourceFilePath, analyzedSourceFile);

      const [analysis, moduleExports] = await Promise.all([
        analyzedSourceFile,
        import(sourceFilePath),
      ]);

      return { sourceFilePath, analysis, moduleExports };
    })
  );
};

function analyzeSourceFile(sourceFile: SourceFile) {
  const exportedFunctions = sourceFile
    .getFunctions()
    .filter((functionDeclaration) => functionDeclaration.isExported());

  const exportedVariableFunctions = sourceFile
    .getVariableStatements()
    .filter((statement) => statement.isExported())
    .flatMap((statement) => statement.getDeclarations())
    .filter((declaration) => {
      const initializer = declaration.getInitializerOrThrow();

      return (
        initializer.getKind() === SyntaxKind.ArrowFunction ||
        initializer.getKind() === SyntaxKind.FunctionExpression
      );
    });

  const functions = [...exportedFunctions, ...exportedVariableFunctions].map(
    (declaration) => {
      if (Node.isFunctionDeclaration(declaration)) {
        return {
          name: declaration.getName(),
          paramTypes: declaration
            .getParameters()
            .map((p) => p.getType().getText()),
        };
      }

      if (Node.isVariableDeclaration(declaration)) {
        const initializer = declaration.getInitializerOrThrow();

        if (
          Node.isArrowFunction(initializer) ||
          Node.isFunctionExpression(initializer)
        ) {
          return {
            name: declaration.getName(),
            paramTypes: initializer
              .getParameters()
              .map((p) => p.getType().getText()),
          };
        }
      }
    }
  );

  const info = { functions };

  return info;
}
