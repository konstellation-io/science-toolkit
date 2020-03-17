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
const util_1 = require("./util");
class GoReferenceProvider {
    provideReferences(document, position, options, token) {
        return this.doFindReferences(document, position, options, token);
    }
    doFindReferences(document, position, options, token) {
        return new Promise((resolve, reject) => {
            // get current word
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return resolve([]);
            }
            const goGuru = util_1.getBinPath('guru');
            if (!path.isAbsolute(goGuru)) {
                goInstallTools_1.promptForMissingTool('guru');
                return reject('Cannot find tool "guru" to find references.');
            }
            const filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
            const cwd = path.dirname(filename);
            const offset = util_1.byteOffsetAt(document, wordRange.start);
            const env = util_1.getToolsEnvVars();
            const buildTags = util_1.getGoConfig(document.uri)['buildTags'];
            const args = buildTags ? ['-tags', buildTags] : [];
            args.push('-modified', 'referrers', `${filename}:#${offset.toString()}`);
            const process = cp.execFile(goGuru, args, { env }, (err, stdout, stderr) => {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('guru');
                        return reject('Cannot find tool "guru" to find references.');
                    }
                    if (err && err.killed !== true) {
                        return reject(`Error running guru: ${err.message || stderr}`);
                    }
                    const lines = stdout.toString().split('\n');
                    const results = [];
                    for (const line of lines) {
                        const match = /^(.*):(\d+)\.(\d+)-(\d+)\.(\d+):/.exec(line);
                        if (!match) {
                            continue;
                        }
                        const [_, file, lineStartStr, colStartStr, lineEndStr, colEndStr] = match;
                        const referenceResource = vscode.Uri.file(path.resolve(cwd, file));
                        if (!options.includeDeclaration) {
                            if (document.uri.fsPath === referenceResource.fsPath &&
                                position.line === Number(lineStartStr) - 1) {
                                continue;
                            }
                        }
                        const range = new vscode.Range(+lineStartStr - 1, +colStartStr - 1, +lineEndStr - 1, +colEndStr);
                        results.push(new vscode.Location(referenceResource, range));
                    }
                    resolve(results);
                }
                catch (e) {
                    reject(e);
                }
            });
            if (process.pid) {
                process.stdin.end(util_1.getFileArchive(document));
            }
            token.onCancellationRequested(() => util_1.killTree(process.pid));
        });
    }
}
exports.GoReferenceProvider = GoReferenceProvider;
//# sourceMappingURL=goReferences.js.map