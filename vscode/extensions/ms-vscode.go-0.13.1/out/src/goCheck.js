/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const goBuild_1 = require("./goBuild");
const goLanguageServer_1 = require("./goLanguageServer");
const goLint_1 = require("./goLint");
const goMain_1 = require("./goMain");
const goModules_1 = require("./goModules");
const goStatus_1 = require("./goStatus");
const goVet_1 = require("./goVet");
const testUtils_1 = require("./testUtils");
const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
statusBarItem.command = 'go.test.showOutput';
const neverAgain = { title: `Don't Show Again` };
function removeTestStatus(e) {
    if (e.document.isUntitled) {
        return;
    }
    statusBarItem.hide();
    statusBarItem.text = '';
}
exports.removeTestStatus = removeTestStatus;
function notifyIfGeneratedFile(e) {
    const ctx = this;
    if (e.document.isUntitled || e.document.languageId !== 'go') {
        return;
    }
    if (ctx.globalState.get('ignoreGeneratedCodeWarning') !== true &&
        e.document.lineAt(0).text.match(/^\/\/ Code generated .* DO NOT EDIT\.$/)) {
        vscode.window.showWarningMessage('This file seems to be generated. DO NOT EDIT.', neverAgain).then((result) => {
            if (result === neverAgain) {
                ctx.globalState.update('ignoreGeneratedCodeWarning', true);
            }
        });
    }
}
exports.notifyIfGeneratedFile = notifyIfGeneratedFile;
function check(fileUri, goConfig) {
    goStatus_1.diagnosticsStatusBarItem.hide();
    goStatus_1.outputChannel.clear();
    const runningToolsPromises = [];
    const cwd = path.dirname(fileUri.fsPath);
    // If a user has enabled diagnostics via a language server,
    // then we disable running build or vet to avoid duplicate errors and warnings.
    const lspConfig = goLanguageServer_1.parseLanguageServerConfig();
    const disableBuildAndVet = lspConfig.enabled && lspConfig.features.diagnostics;
    let testPromise;
    const testConfig = {
        goConfig,
        dir: cwd,
        flags: testUtils_1.getTestFlags(goConfig),
        background: true,
        applyCodeCoverage: !!goConfig['coverOnSave']
    };
    const runTest = () => {
        if (testPromise) {
            return testPromise;
        }
        testPromise = goModules_1.isModSupported(fileUri).then((isMod) => {
            testConfig.isMod = isMod;
            return testUtils_1.goTest(testConfig);
        });
        return testPromise;
    };
    if (!disableBuildAndVet && !!goConfig['buildOnSave'] && goConfig['buildOnSave'] !== 'off') {
        runningToolsPromises.push(goModules_1.isModSupported(fileUri)
            .then((isMod) => goBuild_1.goBuild(fileUri, isMod, goConfig, goConfig['buildOnSave'] === 'workspace'))
            .then((errors) => ({ diagnosticCollection: goMain_1.buildDiagnosticCollection, errors })));
    }
    if (!!goConfig['testOnSave']) {
        statusBarItem.show();
        statusBarItem.text = 'Tests Running';
        runTest().then((success) => {
            if (statusBarItem.text === '') {
                return;
            }
            if (success) {
                statusBarItem.text = 'Tests Passed';
            }
            else {
                statusBarItem.text = 'Tests Failed';
            }
        });
    }
    if (!!goConfig['lintOnSave'] && goConfig['lintOnSave'] !== 'off') {
        runningToolsPromises.push(goLint_1.goLint(fileUri, goConfig, goConfig['lintOnSave']).then((errors) => ({
            diagnosticCollection: goMain_1.lintDiagnosticCollection,
            errors
        })));
    }
    if (!disableBuildAndVet && !!goConfig['vetOnSave'] && goConfig['vetOnSave'] !== 'off') {
        runningToolsPromises.push(goVet_1.goVet(fileUri, goConfig, goConfig['vetOnSave'] === 'workspace').then((errors) => ({
            diagnosticCollection: goMain_1.vetDiagnosticCollection,
            errors
        })));
    }
    if (!!goConfig['coverOnSave']) {
        runTest().then((success) => {
            if (!success) {
                return [];
            }
        });
    }
    return Promise.all(runningToolsPromises);
}
exports.check = check;
//# sourceMappingURL=goCheck.js.map