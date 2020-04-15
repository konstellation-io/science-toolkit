/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const path = require("path");
const vscode = require("vscode");
const goInstallTools_1 = require("./goInstallTools");
const goPath_1 = require("./goPath");
const util_1 = require("./util");
class GoImplementationProvider {
    provideImplementation(document, position, token) {
        // To keep `guru implements` fast we want to restrict the scope of the search to current workspace
        // If no workspace is open, then no-op
        const root = util_1.getWorkspaceFolderPath(document.uri);
        if (!root) {
            vscode.window.showInformationMessage('Cannot find implementations when there is no workspace open.');
            return;
        }
        const goRuntimePath = util_1.getBinPath('go');
        if (!goRuntimePath) {
            vscode.window.showErrorMessage(`Failed to run "go list" to get the scope to find implementations as the "go" binary cannot be found in either GOROOT(${process.env['GOROOT']}) or PATH(${goPath_1.envPath})`);
            return;
        }
        return new Promise((resolve, reject) => {
            if (token.isCancellationRequested) {
                return resolve(null);
            }
            const env = util_1.getToolsEnvVars();
            const listProcess = cp.execFile(goRuntimePath, ['list', '-e', '-json'], { cwd: root, env }, (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                const listOutput = JSON.parse(stdout.toString());
                const filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
                const cwd = path.dirname(filename);
                const offset = util_1.byteOffsetAt(document, position);
                const goGuru = util_1.getBinPath('guru');
                const buildTags = util_1.getGoConfig(document.uri)['buildTags'];
                const args = buildTags ? ['-tags', buildTags] : [];
                if (listOutput.Root && listOutput.ImportPath) {
                    args.push('-scope', `${listOutput.ImportPath}/...`);
                }
                args.push('-json', 'implements', `${filename}:#${offset.toString()}`);
                const guruProcess = cp.execFile(goGuru, args, { env }, (guruErr, guruStdOut, guruStdErr) => {
                    if (guruErr && guruErr.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('guru');
                        return resolve(null);
                    }
                    if (guruErr) {
                        return reject(guruErr);
                    }
                    const guruOutput = JSON.parse(guruStdOut.toString());
                    const results = [];
                    const addResults = (list) => {
                        list.forEach((ref) => {
                            const match = /^(.*):(\d+):(\d+)/.exec(ref.pos);
                            if (!match) {
                                return;
                            }
                            const [_, file, lineStartStr, colStartStr] = match;
                            const referenceResource = vscode.Uri.file(path.resolve(cwd, file));
                            const range = new vscode.Range(+lineStartStr - 1, +colStartStr - 1, +lineStartStr - 1, +colStartStr);
                            results.push(new vscode.Location(referenceResource, range));
                        });
                    };
                    // If we looked for implementation of method go to method implementations only
                    if (guruOutput.to_method) {
                        addResults(guruOutput.to_method);
                    }
                    else if (guruOutput.to) {
                        addResults(guruOutput.to);
                    }
                    else if (guruOutput.from) {
                        addResults(guruOutput.from);
                    }
                    else if (guruOutput.fromptr) {
                        addResults(guruOutput.fromptr);
                    }
                    return resolve(results);
                });
                token.onCancellationRequested(() => util_1.killTree(guruProcess.pid));
            });
            token.onCancellationRequested(() => util_1.killTree(listProcess.pid));
        });
    }
}
exports.GoImplementationProvider = GoImplementationProvider;
//# sourceMappingURL=goImplementations.js.map