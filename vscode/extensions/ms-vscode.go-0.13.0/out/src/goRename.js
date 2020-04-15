/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const vscode = require("vscode");
const diffUtils_1 = require("./diffUtils");
const goInstallTools_1 = require("./goInstallTools");
const goStatus_1 = require("./goStatus");
const util_1 = require("./util");
class GoRenameProvider {
    provideRenameEdits(document, position, newName, token) {
        return vscode.workspace.saveAll(false).then(() => {
            return this.doRename(document, position, newName, token);
        });
    }
    doRename(document, position, newName, token) {
        return new Promise((resolve, reject) => {
            const filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
            const range = document.getWordRangeAtPosition(position);
            const pos = range ? range.start : position;
            const offset = util_1.byteOffsetAt(document, pos);
            const env = util_1.getToolsEnvVars();
            const gorename = util_1.getBinPath('gorename');
            const buildTags = util_1.getGoConfig(document.uri)['buildTags'];
            const gorenameArgs = ['-offset', filename + ':#' + offset, '-to', newName];
            if (buildTags) {
                gorenameArgs.push('-tags', buildTags);
            }
            const canRenameToolUseDiff = diffUtils_1.isDiffToolAvailable();
            if (canRenameToolUseDiff) {
                gorenameArgs.push('-d');
            }
            let p;
            if (token) {
                token.onCancellationRequested(() => util_1.killProcess(p));
            }
            p = cp.execFile(gorename, gorenameArgs, { env }, (err, stdout, stderr) => {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('gorename');
                        return reject('Could not find gorename tool.');
                    }
                    if (err) {
                        const errMsg = stderr ? 'Rename failed: ' + stderr.replace(/\n/g, ' ') : 'Rename failed';
                        console.log(errMsg);
                        goStatus_1.outputChannel.appendLine(errMsg);
                        goStatus_1.outputChannel.show();
                        return reject();
                    }
                    const result = new vscode.WorkspaceEdit();
                    if (canRenameToolUseDiff) {
                        const filePatches = diffUtils_1.getEditsFromUnifiedDiffStr(stdout);
                        filePatches.forEach((filePatch) => {
                            const fileUri = vscode.Uri.file(filePatch.fileName);
                            filePatch.edits.forEach((edit) => {
                                edit.applyUsingWorkspaceEdit(result, fileUri);
                            });
                        });
                    }
                    return resolve(result);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
}
exports.GoRenameProvider = GoRenameProvider;
//# sourceMappingURL=goRename.js.map