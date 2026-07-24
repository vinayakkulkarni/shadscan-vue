import ts from 'typescript';

export interface ScriptImport {
  moduleSpecifier: string;
  /** Imported binding names (local names after `as` renames use original name). */
  named: string[];
  defaultName?: string;
  namespaceName?: string;
  line: number;
}

const scriptKindFor = (fileName: string): ts.ScriptKind => {
  if (fileName.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (fileName.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (fileName.endsWith('.js') || fileName.endsWith('.mjs') || fileName.endsWith('.cjs')) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
};

export const parseScript = (fileName: string, source: string): ts.SourceFile =>
  ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKindFor(fileName));

export const walkScript = (sourceFile: ts.SourceFile, visit: (node: ts.Node) => void): void => {
  const walk = (node: ts.Node): void => {
    visit(node);
    ts.forEachChild(node, walk);
  };
  walk(sourceFile);
};

export const collectImports = (sourceFile: ts.SourceFile): ScriptImport[] => {
  const imports: ScriptImport[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }
    if (!ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const named: string[] = [];
    let defaultName: string | undefined;
    let namespaceName: string | undefined;
    const clause = statement.importClause;
    if (clause !== undefined) {
      if (clause.name !== undefined) {
        defaultName = clause.name.text;
      }
      const bindings = clause.namedBindings;
      if (bindings !== undefined) {
        if (ts.isNamespaceImport(bindings)) {
          namespaceName = bindings.name.text;
        } else {
          for (const element of bindings.elements) {
            named.push((element.propertyName ?? element.name).text);
          }
        }
      }
    }
    const line = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line + 1;
    imports.push({
      moduleSpecifier: statement.moduleSpecifier.text,
      named,
      defaultName,
      namespaceName,
      line,
    });
  }
  return imports;
};
