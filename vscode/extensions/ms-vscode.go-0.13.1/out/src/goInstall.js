"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const path = require("path");
const vscode = require("vscode");
const goModules_1 = require("./goModules");
const goPath_1 = require("./goPath");
const goStatus_1 = require("./goStatus");
const util_1 = require("./util");
function installCurrentPackage() {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active, cannot find current package to install');
            return;
        }
        if (editor.document.languageId !== 'go') {
            vscode.window.showInformationMessage('File in the active editor is not a Go file, cannot find current package to install');
            return;
        }
        const goRuntimePath = util_1.getBinPath('go');
        if (!goRuntimePath) {
            vscode.window.showErrorMessage(`Failed to run "go install" to install the package as the "go" binary cannot be found in either GOROOT(${process.env['GOROOT']}) or PATH(${goPath_1.envPath})`);
            return;
        }
        const env = Object.assign({}, util_1.getToolsEnvVars());
        const cwd = path.dirname(editor.document.uri.fsPath);
        const isMod = yield goModules_1.isModSupported(editor.document.uri);
        // Skip installing if cwd is in the module cache
        if (isMod && cwd.startsWith(util_1.getModuleCache())) {
            return;
        }
        const goConfig = util_1.getGoConfig();
        const buildFlags = goConfig['buildFlags'] || [];
        const args = ['install', ...buildFlags];
        if (goConfig['buildTags'] && buildFlags.indexOf('-tags') === -1) {
            args.push('-tags', goConfig['buildTags']);
        }
        // Find the right importPath instead of directly using `.`. Fixes https://github.com/Microsoft/vscode-go/issues/846
        const currentGoWorkspace = goPath_1.getCurrentGoWorkspaceFromGOPATH(util_1.getCurrentGoPath(), cwd);
        const importPath = currentGoWorkspace && !isMod ? cwd.substr(currentGoWorkspace.length + 1) : '.';
        args.push(importPath);
        goStatus_1.outputChannel.clear();
        goStatus_1.outputChannel.show();
        goStatus_1.outputChannel.appendLine(`Installing ${importPath === '.' ? 'current package' : importPath}`);
        cp.execFile(goRuntimePath, args, { env, cwd }, (err, stdout, stderr) => {
            goStatus_1.outputChannel.appendLine(err ? `Installation failed: ${stderr}` : `Installation successful`);
        });
    });
}
exports.installCurrentPackage = installCurrentPackage;
//# sourceMappingURL=goInstall.js.map