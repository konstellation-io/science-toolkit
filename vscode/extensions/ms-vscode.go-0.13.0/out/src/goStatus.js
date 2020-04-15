/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const goMode_1 = require("./goMode");
const goModules_1 = require("./goModules");
exports.outputChannel = vscode.window.createOutputChannel('Go');
exports.diagnosticsStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
let statusBarEntry;
const statusBarItemModule = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
statusBarItemModule.text = '$(megaphone) Go Modules';
statusBarItemModule.tooltip =
    'Modules is enabled for this project. Click to learn more about Modules support in VS Code.';
statusBarItemModule.command = 'go.open.modulewiki';
function showHideStatus(editor) {
    if (statusBarEntry) {
        if (!editor) {
            statusBarEntry.hide();
        }
        else if (vscode.languages.match(goMode_1.GO_MODE, editor.document)) {
            statusBarEntry.show();
        }
        else {
            statusBarEntry.hide();
        }
    }
    if (editor) {
        goModules_1.isModSupported(editor.document.uri).then((isMod) => {
            if (isMod) {
                statusBarItemModule.show();
            }
            else {
                statusBarItemModule.hide();
            }
        });
    }
    else {
        statusBarItemModule.hide();
    }
}
exports.showHideStatus = showHideStatus;
function hideGoStatus() {
    if (statusBarEntry) {
        statusBarEntry.dispose();
    }
}
exports.hideGoStatus = hideGoStatus;
function showGoStatus(message, command, tooltip) {
    statusBarEntry = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, Number.MIN_VALUE);
    statusBarEntry.text = `$(alert) ${message}`;
    statusBarEntry.command = command;
    statusBarEntry.tooltip = tooltip;
    statusBarEntry.show();
}
exports.showGoStatus = showGoStatus;
//# sourceMappingURL=goStatus.js.map