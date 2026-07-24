import type ts from 'typescript';
import type { ProjectDiscovery } from '../discovery.js';
import { collectSources, type CollectedSources, type SourceFile } from '../rules/source-files.js';
import { parseVueFile, type ParsedSfc } from './sfc.js';
import { collectImports, parseScript, type ScriptImport } from './typescript.js';

export interface ParsedFile {
  relPath: string;
  path: string;
  kind: SourceFile['kind'];
  text: string;
  /** Present for .vue files that parsed. */
  sfc?: ParsedSfc;
  /** TS AST of .ts/.js files, or of the SFC's script/scriptSetup content. */
  scriptAst?: ts.SourceFile;
  imports: ScriptImport[];
  parseError?: string;
}

export interface ParsedProject {
  files: ParsedFile[];
  collected: CollectedSources;
}

const parsedCache = new WeakMap<ProjectDiscovery, Promise<ParsedProject>>();

export const parseProject = (discovery: ProjectDiscovery): Promise<ParsedProject> => {
  const cached = parsedCache.get(discovery);
  if (cached !== undefined) {
    return cached;
  }
  const promise = parseProjectUncached(discovery);
  parsedCache.set(discovery, promise);
  return promise;
};

/**
 * SFC script blocks start mid-file; wrap line references through the block
 * offset so evidence lines point at the .vue file, not the virtual script.
 */
export const scriptLineOffset = (sfc: ParsedSfc): number => {
  const block = sfc.descriptor.scriptSetup ?? sfc.descriptor.script;
  if (block === null) {
    return 0;
  }
  return block.loc.start.line - 1;
};

const parseProjectUncached = async (discovery: ProjectDiscovery): Promise<ParsedProject> => {
  const collected = await collectSources(discovery);
  const files: ParsedFile[] = [];
  for (const file of collected.files) {
    if (file.kind === 'vue') {
      try {
        const sfc = parseVueFile(file.relPath, file.text);
        const scriptBlock = sfc.descriptor.scriptSetup ?? sfc.descriptor.script;
        let scriptAst: ts.SourceFile | undefined;
        let imports: ScriptImport[] = [];
        if (scriptBlock !== null) {
          scriptAst = parseScript(`${file.relPath}.ts`, scriptBlock.content);
          const offset = scriptLineOffset(sfc);
          imports = collectImports(scriptAst).map((entry) => ({
            ...entry,
            line: entry.line + offset,
          }));
        }
        files.push({
          relPath: file.relPath,
          path: file.path,
          kind: file.kind,
          text: file.text,
          sfc,
          scriptAst,
          imports,
          parseError:
            sfc.errors.length > 0
              ? sfc.errors.map((error) => String(error.message ?? error)).join('; ')
              : undefined,
        });
      } catch (error) {
        files.push({
          relPath: file.relPath,
          path: file.path,
          kind: file.kind,
          text: file.text,
          imports: [],
          parseError: error instanceof Error ? error.message : String(error),
        });
      }
    } else if (file.kind === 'ts' || file.kind === 'js') {
      const scriptAst = parseScript(file.relPath, file.text);
      files.push({
        relPath: file.relPath,
        path: file.path,
        kind: file.kind,
        text: file.text,
        scriptAst,
        imports: collectImports(scriptAst),
      });
    } else {
      files.push({
        relPath: file.relPath,
        path: file.path,
        kind: file.kind,
        text: file.text,
        imports: [],
      });
    }
  }
  return { files, collected };
};
