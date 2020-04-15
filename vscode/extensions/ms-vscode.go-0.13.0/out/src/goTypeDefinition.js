/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const path = require("path");
const vscode = require("vscode");
const goDeclaration_1 = require("./goDeclaration");
const goInstallTools_1 = require("./goInstallTools");
const util_1 = require("./util");
class GoTypeDefinitionProvider {
    provideTypeDefinition(document, position, token) {
        const adjustedPos = goDeclaration_1.adjustWordPosition(document, position);
        if (!adjustedPos[0]) {
            return Promise.resolve(null);
        }
        position = adjustedPos[2];
        return new Promise((resolve, reject) => {
            const goGuru = util_1.getBinPath('guru');
            if (!path.isAbsolute(goGuru)) {
                goInstallTools_1.promptForMissingTool('guru');
                return reject('Cannot find tool "guru" to find type definitions.');
            }
            const filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
            const offset = util_1.byteOffsetAt(document, position);
            const env = util_1.getToolsEnvVars();
            const buildTags = util_1.getGoConfig(document.uri)['buildTags'];
            const args = buildTags ? ['-tags', buildTags] : [];
            args.push('-json', '-modified', 'describe', `${filename}:#${offset.toString()}`);
            const process = cp.execFile(goGuru, args, { env }, (guruErr, stdout, stderr) => {
                try {
                    if (guruErr && guruErr.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('guru');
                        return resolve(null);
                    }
                    if (guruErr) {
                        return reject(guruErr);
                    }
                    const guruOutput = JSON.parse(stdout.toString());
                    if (!guruOutput.value || !guruOutput.value.typespos) {
                        if (guruOutput.value &&
                            guruOutput.value.type &&
                            !util_1.goBuiltinTypes.has(guruOutput.value.type) &&
                            guruOutput.value.type !== 'invalid type') {
                            console.log(`no typespos from guru's output - try to update guru tool`);
                        }
                        // Fall back to position of declaration
                        return goDeclaration_1.definitionLocation(document, position, null, false, token).then((definitionInfo) => {
                            if (definitionInfo == null || definitionInfo.file == null) {
                                return null;
                            }
                            const definitionResource = vscode.Uri.file(definitionInfo.file);
                            const pos = new vscode.Position(definitionInfo.line, definitionInfo.column);
                            resolve(new vscode.Location(definitionResource, pos));
                        }, (err) => {
                            const miss = goDeclaration_1.parseMissingError(err);
                            if (miss[0]) {
                                goInstallTools_1.promptForMissingTool(miss[1]);
                            }
                            else if (err) {
                                return Promise.reject(err);
                            }
                            return Promise.resolve(null);
                        });
                    }
                    const results = [];
                    guruOutput.value.typespos.forEach((ref) => {
                        const match = /^(.*):(\d+):(\d+)/.exec(ref.objpos);
                        if (!match) {
                            return;
                        }
                        const [_, file, line, col] = match;
                        const referenceResource = vscode.Uri.file(file);
                        const pos = new vscode.Position(parseInt(line, 10) - 1, parseInt(col, 10) - 1);
                        results.push(new vscode.Location(referenceResource, pos));
                    });
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
exports.GoTypeDefinitionProvider = GoTypeDefinitionProvider;
//# sourceMappingURL=goTypeDefinition.js.map