import log from 'electron-log';
import { openNewGitHubIssue } from 'electron-util';
import path from 'path';
import { app } from 'electron';

// Note: The import for 'electron-unhandled' has been removed from the top
// and will be dynamically imported inside the default export function.

// New replacement function
const getDebugInfo = () => {
    return [
        `Platform: ${process.platform}`,
        `OS Version: ${process.getSystemVersion()}`,
        `Electron: ${process.versions.electron}`,
        `Chromium: ${process.versions.chrome}`,
        `Node: ${process.versions.node}`,
        `Locale: ${app.getLocale()}`
    ].join('\n');
};

// Convert the default export to an async function
export default async () => {
  // Use require() for the package.json file, which is synchronous and fine.
  const packageJson = require(path.join(app.getAppPath(), 'package.json'));

  // Use dynamic import() for the ESM package 'electron-unhandled'
  // and await its result.
  const { default: unhandled } = await import('electron-unhandled');

  unhandled({
    logger: log.error,
    reportButton: error => {
      openNewGitHubIssue({
        repoUrl: packageJson.repository,
        body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${getDebugInfo()}`
      });
    }
  });
};
