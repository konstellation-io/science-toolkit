/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const vscode = require("vscode");
const goInstallTools_1 = require("./goInstallTools");
const util_1 = require("./util");
function runFillStruct(editor) {
    const args = getCommonArgs(editor);
    if (!args) {
        return Promise.reject('No args');
    }
    return execFillStruct(editor, args);
}
exports.runFillStruct = runFillStruct;
function getCommonArgs(editor) {
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    if (!editor.document.fileName.endsWith('.go')) {
        vscode.window.showInformationMessage('Current file is not a Go file.');
        return;
    }
    const args = ['-modified', '-file', editor.document.fileName];
    if (editor.selection.isEmpty) {
        const offset = util_1.byteOffsetAt(editor.document, editor.selection.start);
        args.push('-offset');
        args.push(offset.toString());
    }
    else {
        args.push('-line');
        args.push(`${editor.selection.start.line + 1}`);
    }
    return args;
}
function getTabsCount(editor) {
    const startline = editor.selection.start.line;
    const tabs = editor.document.lineAt(startline).text.match('^\t*');
    return tabs ? tabs.length : 0;
}
function execFillStruct(editor, args) {
    const fillstruct = util_1.getBinPath('fillstruct');
    const input = util_1.getFileArchive(editor.document);
    const tabsCount = getTabsCount(editor);
    return new Promise((resolve, reject) => {
        const p = cp.execFile(fillstruct, args, { env: util_1.getToolsEnvVars() }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('fillstruct');
                    return reject();
                }
                if (err) {
                    vscode.window.showInformationMessage(`Cannot fill struct: ${stderr}`);
                    return reject();
                }
                const output = JSON.parse(stdout);
                if (output.length === 0) {
                    vscode.window.showInformationMessage(`Got empty fillstruct output`);
                    return reject();
                }
                const indent = '\t'.repeat(tabsCount);
                editor
                    .edit((editBuilder) => {
                    output.forEach((structToFill) => {
                        const out = structToFill.code.replace(/\n/g, '\n' + indent);
                        const rangeToReplace = new vscode.Range(editor.document.positionAt(structToFill.start), editor.document.positionAt(structToFill.end));
                        editBuilder.replace(rangeToReplace, out);
                    });
                })
                    .then(() => resolve());
            }
            catch (e) {
                reject(e);
            }
        });
        if (p.pid) {
            p.stdin.end(input);
        }
    });
}
//# sourceMappingURL=goFillStruct.js.map