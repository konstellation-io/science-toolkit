/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const path_1 = require("path");
const vscode = require("vscode");
const goInstallTools_1 = require("./goInstallTools");
const util_1 = require("./util");
// Supports only passing interface, see TODO in implCursor to finish
const inputRegex = /^(\w+\ \*?\w+\ )?([\w./]+)$/;
function implCursor() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }
    const cursor = editor.selection;
    return vscode.window
        .showInputBox({
        placeHolder: 'f *File io.Closer',
        prompt: 'Enter receiver and interface to implement.'
    })
        .then((implInput) => {
        if (typeof implInput === 'undefined') {
            return;
        }
        const matches = implInput.match(inputRegex);
        if (!matches) {
            vscode.window.showInformationMessage(`Not parsable input: ${implInput}`);
            return;
        }
        // TODO: automatically detect type name at cursor
        // if matches[1] is undefined then detect receiver type
        // take first character and use as receiver name
        runGoImpl([matches[1], matches[2]], cursor.start, editor);
    });
}
exports.implCursor = implCursor;
function runGoImpl(args, insertPos, editor) {
    const goimpl = util_1.getBinPath('impl');
    const p = cp.execFile(goimpl, args, { env: util_1.getToolsEnvVars(), cwd: path_1.dirname(editor.document.fileName) }, (err, stdout, stderr) => {
        if (err && err.code === 'ENOENT') {
            goInstallTools_1.promptForMissingTool('impl');
            return;
        }
        if (err) {
            vscode.window.showInformationMessage(`Cannot stub interface: ${stderr}`);
            return;
        }
        editor.edit((editBuilder) => {
            editBuilder.insert(insertPos, stdout);
        });
    });
    if (p.pid) {
        p.stdin.end();
    }
}
//# sourceMappingURL=goImpl.js.map