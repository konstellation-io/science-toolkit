/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const vscode = require("vscode");
const goBuild_1 = require("./goBuild");
const goPath_1 = require("./goPath");
const goStatus_1 = require("./goStatus");
const util_1 = require("./util");
function goGetPackage() {
    const editor = vscode.window.activeTextEditor;
    const selection = editor.selection;
    const selectedText = editor.document.lineAt(selection.active.line).text;
    const importPath = util_1.getImportPath(selectedText);
    if (importPath === '') {
        vscode.window.showErrorMessage('No import path to get');
        return;
    }
    const goRuntimePath = util_1.getBinPath('go');
    if (!goRuntimePath) {
        return vscode.window.showErrorMessage(`Failed to run "go get" to get package as the "go" binary cannot be found in either GOROOT(${process.env['GOROOT']}) or PATH(${goPath_1.envPath})`);
    }
    const env = Object.assign({}, process.env, { GOPATH: util_1.getCurrentGoPath() });
    cp.execFile(goRuntimePath, ['get', '-v', importPath], { env }, (err, stdout, stderr) => {
        // go get -v uses stderr to write output regardless of success or failure
        if (stderr !== '') {
            goStatus_1.outputChannel.show();
            goStatus_1.outputChannel.clear();
            goStatus_1.outputChannel.appendLine(stderr);
            goBuild_1.buildCode();
            return;
        }
        // go get -v doesn't write anything when the package already exists
        vscode.window.showInformationMessage(`Package already exists: ${importPath}`);
    });
}
exports.goGetPackage = goGetPackage;
//# sourceMappingURL=goGetPackage.js.map