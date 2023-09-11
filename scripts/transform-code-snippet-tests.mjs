import { readdir, readFile, writeFile } from 'fs';
import { join } from 'path';

const testCodeSnippetDirectory = './unit-tests/code-snippets';

// Extract import statements from the content
const extractImports = (content) => {
  const importRegex = /^import .* from .*;$/gm;
  return content.match(importRegex) || [];
};

// Transform the content of a test file into a code snippet
const transformTestToSnippet = (content) => {
  const itBodyRegex =
    /it\(['"`].+['"`],\s*(?:async\s*)?\(\)\s*=>\s*\{([\s\S]*?)\}\);/g;
  let transformedContent = '';
  let match;

  while ((match = itBodyRegex.exec(content)) !== null) {
    transformedContent += match[1].trim() + '\n';
  }

  transformedContent = transformedContent.replace(/expect\([^]*?\);/g, '');

  if (/await/.test(transformedContent)) {
    transformedContent = `(async () => {\n${transformedContent}\n})();`;
  }

  return transformedContent;
};

// Read and transform test files
readdir(testCodeSnippetDirectory, (err, files) => {
  if (err) {
    console.error(`Error reading the directory: ${err}`);
    return;
  }

  const specFiles = files.filter((file) => file.endsWith('.spec.ts'));

  specFiles.forEach((fileName) => {
    const filePath = join(testCodeSnippetDirectory, fileName);
    readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        console.error(`Error reading the file ${filePath}: ${err}`);
        return;
      }

      const importStatements = extractImports(content).join('\n');
      const transformedContent = transformTestToSnippet(content);
      const snippetContent = `${importStatements}\n\n${transformedContent}`;

      const newFilePath = join(
        './code-snippets',
        fileName.replace('.spec', ''),
      );
      writeFile(newFilePath, snippetContent, 'utf8', (err) => {
        if (err) {
          console.error(`Error writing the file ${newFilePath}: ${err}`);
          return;
        }
        console.log(`Successfully transformed ${filePath} to ${newFilePath}`);
      });
    });
  });
});
