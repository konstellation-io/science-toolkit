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
const goModules_1 = require("./goModules");
const goPackages_1 = require("./goPackages");
const goPath_1 = require("./goPath");
const goStatus_1 = require("./goStatus");
const testUtils_1 = require("./testUtils");
const util_1 = require("./util");
/**
 * Builds current package or workspace.
 */
function buildCode(buildWorkspace) {
    const editor = vscode.window.activeTextEditor;
    if (!buildWorkspace) {
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active, cannot find current package to build');
            return;
        }
        if (editor.document.languageId !== 'go') {
            vscode.window.showInformationMessage('File in the active editor is not a Go file, cannot find current package to build');
            return;
        }
    }
    const documentUri = editor ? editor.document.uri : null;
    const goConfig = util_1.getGoConfig(documentUri);
    goStatus_1.outputChannel.clear(); // Ensures stale output from build on save is cleared
    goStatus_1.diagnosticsStatusBarItem.show();
    goStatus_1.diagnosticsStatusBarItem.text = 'Building...';
    goModules_1.isModSupported(documentUri).then((isMod) => {
        goBuild(documentUri, isMod, goConfig, buildWorkspace)
            .then((errors) => {
            util_1.handleDiagnosticErrors(editor ? editor.document : null, errors, goMain_1.buildDiagnosticCollection);
            goStatus_1.diagnosticsStatusBarItem.hide();
        })
            .catch((err) => {
            vscode.window.showInformationMessage('Error: ' + err);
            goStatus_1.diagnosticsStatusBarItem.text = 'Build Failed';
        });
    });
}
exports.buildCode = buildCode;
/**
 * Runs go build -i or go test -i and presents the output in the 'Go' channel and in the diagnostic collections.
 *
 * @param fileUri Document uri.
 * @param isMod Boolean denoting if modules are being used.
 * @param goConfig Configuration for the Go extension.
 * @param buildWorkspace If true builds code in all workspace.
 */
function goBuild(fileUri, isMod, goConfig, buildWorkspace) {
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
        const updateRunning = () => {
            if (closureEpoch === epoch) {
                running = false;
            }
        };
        const currentWorkspace = util_1.getWorkspaceFolderPath(fileUri);
        const cwd = buildWorkspace && currentWorkspace ? currentWorkspace : path.dirname(fileUri.fsPath);
        if (!path.isAbsolute(cwd)) {
            return Promise.resolve([]);
        }
        // Skip building if cwd is in the module cache
        if (isMod && cwd.startsWith(util_1.getModuleCache())) {
            return [];
        }
        const buildEnv = Object.assign({}, util_1.getToolsEnvVars());
        const tmpPath = util_1.getTempFilePath('go-code-check');
        const isTestFile = fileUri && fileUri.fsPath.endsWith('_test.go');
        const buildFlags = isTestFile
            ? testUtils_1.getTestFlags(goConfig)
            : Array.isArray(goConfig['buildFlags'])
                ? [...goConfig['buildFlags']]
                : [];
        const buildArgs = isTestFile ? ['test', '-c'] : ['build'];
        if (goConfig['installDependenciesWhenBuilding'] === true && !isMod) {
            buildArgs.push('-i');
            // Remove the -i flag from user as we add it anyway
            if (buildFlags.indexOf('-i') > -1) {
                buildFlags.splice(buildFlags.indexOf('-i'), 1);
            }
        }
        buildArgs.push(...buildFlags);
        if (goConfig['buildTags'] && buildFlags.indexOf('-tags') === -1) {
            buildArgs.push('-tags');
            buildArgs.push(goConfig['buildTags']);
        }
        if (buildWorkspace && currentWorkspace && !isTestFile) {
            goStatus_1.outputChannel.appendLine(`Starting building the current workspace at ${currentWorkspace}`);
            return goPackages_1.getNonVendorPackages(currentWorkspace).then((pkgs) => {
                running = true;
                return util_1.runTool(buildArgs.concat(Array.from(pkgs.keys())), currentWorkspace, 'error', true, null, buildEnv, true, tokenSource.token).then((v) => {
                    updateRunning();
                    return v;
                });
            });
        }
        goStatus_1.outputChannel.appendLine(`Starting building the current package at ${cwd}`);
        // Find the right importPath instead of directly using `.`. Fixes https://github.com/Microsoft/vscode-go/issues/846
        const currentGoWorkspace = goPath_1.getCurrentGoWorkspaceFromGOPATH(util_1.getCurrentGoPath(), cwd);
        let importPath = '.';
        if (currentGoWorkspace && !isMod) {
            importPath = cwd.substr(currentGoWorkspace.length + 1);
        }
        else {
            goStatus_1.outputChannel.appendLine(`Not able to determine import path of current package by using cwd: ${cwd} and Go workspace: ${currentGoWorkspace}`);
        }
        running = true;
        return util_1.runTool(buildArgs.concat('-o', tmpPath, importPath), cwd, 'error', true, null, buildEnv, true, tokenSource.token).then((v) => {
            updateRunning();
            return v;
        });
    });
}
exports.goBuild = goBuild;
let epoch = 0;
let tokenSource;
let running = false;
//# sourceMappingURL=goBuild.js.map