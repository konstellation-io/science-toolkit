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
const path = require("path");
const vscode = require("vscode");
const goMain_1 = require("./goMain");
const goStatus_1 = require("./goStatus");
const util_1 = require("./util");
/**
 * Runs go vet in the current package or workspace.
 */
function vetCode(vetWorkspace) {
    const editor = vscode.window.activeTextEditor;
    if (!editor && !vetWorkspace) {
        vscode.window.showInformationMessage('No editor is active, cannot find current package to vet');
        return;
    }
    if (editor.document.languageId !== 'go' && !vetWorkspace) {
        vscode.window.showInformationMessage('File in the active editor is not a Go file, cannot find current package to vet');
        return;
    }
    const documentUri = editor ? editor.document.uri : null;
    const goConfig = util_1.getGoConfig(documentUri);
    goStatus_1.outputChannel.clear(); // Ensures stale output from vet on save is cleared
    goStatus_1.diagnosticsStatusBarItem.show();
    goStatus_1.diagnosticsStatusBarItem.text = 'Vetting...';
    goVet(documentUri, goConfig, vetWorkspace)
        .then((warnings) => {
        util_1.handleDiagnosticErrors(editor ? editor.document : null, warnings, goMain_1.vetDiagnosticCollection);
        goStatus_1.diagnosticsStatusBarItem.hide();
    })
        .catch((err) => {
        vscode.window.showInformationMessage('Error: ' + err);
        goStatus_1.diagnosticsStatusBarItem.text = 'Vetting Failed';
    });
}
exports.vetCode = vetCode;
/**
 * Runs go vet or go tool vet and presents the output in the 'Go' channel and in the diagnostic collections.
 *
 * @param fileUri Document uri.
 * @param goConfig Configuration for the Go extension.
 * @param vetWorkspace If true vets code in all workspace.
 */
function goVet(fileUri, goConfig, vetWorkspace) {
    return __awaiter(this, void 0, void 0, function* () {
        epoch++;
        const closureEpoch = epoch;
        if (tokenSource) {
            if (running) {
                tokenSource.cancel();
            }
            tokenSource.dispose();
        }
        tokenSource = new vscode.CancellationTokenSource();
        const currentWorkspace = util_1.getWorkspaceFolderPath(fileUri);
        const cwd = vetWorkspace && currentWorkspace ? currentWorkspace : path.dirname(fileUri.fsPath);
        if (!path.isAbsolute(cwd)) {
            return Promise.resolve([]);
        }
        const vetFlags = goConfig['vetFlags'] || [];
        const vetEnv = Object.assign({}, util_1.getToolsEnvVars());
        const args = [];
        vetFlags.forEach((flag) => {
            if (flag.startsWith('--vettool=') || flag.startsWith('-vettool=')) {
                let vetToolPath = flag.substr(flag.indexOf('=') + 1).trim();
                if (!vetToolPath) {
                    return;
                }
                vetToolPath = util_1.resolvePath(vetToolPath);
                args.push(`${flag.substr(0, flag.indexOf('=') + 1)}${vetToolPath}`);
                return;
            }
            args.push(flag);
        });
        const goVersion = yield util_1.getGoVersion();
        const tagsArg = [];
        if (goConfig['buildTags'] && vetFlags.indexOf('-tags') === -1) {
            tagsArg.push('-tags');
            tagsArg.push(goConfig['buildTags']);
        }
        let vetArgs = ['vet', ...args, ...tagsArg, vetWorkspace ? './...' : '.'];
        if (goVersion.lt('1.10') && args.length) {
            vetArgs = ['tool', 'vet', ...args, ...tagsArg, '.'];
        }
        goStatus_1.outputChannel.appendLine(`Starting "go vet" under the folder ${cwd}`);
        running = true;
        return util_1.runTool(vetArgs, cwd, 'warning', true, null, vetEnv, false, tokenSource.token).then((result) => {
            if (closureEpoch === epoch) {
                running = false;
            }
            return result;
        });
    });
}
exports.goVet = goVet;
let epoch = 0;
let tokenSource;
let running = false;
//# sourceMappingURL=goVet.js.map