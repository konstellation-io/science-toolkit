/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
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
const goModules_1 = require("./goModules");
const testUtils_1 = require("./testUtils");
// lastTestConfig holds a reference to the last executed TestConfig which allows
// the last test to be easily re-executed.
let lastTestConfig;
/**
 * Executes the unit test at the primary cursor using `go test`. Output
 * is sent to the 'Go' channel.
 * @param goConfig Configuration for the Go extension.
 * @param cmd Whether the command is test , benchmark or debug.
 * @param args
 */
function testAtCursor(goConfig, cmd, args) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    if (!editor.document.fileName.endsWith('_test.go')) {
        vscode.window.showInformationMessage('No tests found. Current file is not a test file.');
        return;
    }
    const getFunctions = cmd === 'benchmark' ? testUtils_1.getBenchmarkFunctions : testUtils_1.getTestFunctions;
    editor.document.save().then(() => __awaiter(this, void 0, void 0, function* () {
        try {
            const testFunctions = yield getFunctions(editor.document, null);
            // We use functionName if it was provided as argument
            // Otherwise find any test function containing the cursor.
            const testFunctionName = args && args.functionName
                ? args.functionName
                : testFunctions
                    .filter((func) => func.range.contains(editor.selection.start))
                    .map((el) => el.name)[0];
            if (!testFunctionName) {
                vscode.window.showInformationMessage('No test function found at cursor.');
                return;
            }
            if (cmd === 'debug') {
                yield debugTestAtCursor(editor, testFunctionName, testFunctions, goConfig);
            }
            else if (cmd === 'benchmark' || cmd === 'test') {
                yield runTestAtCursor(editor, testFunctionName, testFunctions, goConfig, cmd, args);
            }
            else {
                throw new Error('Unsupported command.');
            }
        }
        catch (err) {
            console.error(err);
        }
    }));
}
exports.testAtCursor = testAtCursor;
/**
 * Runs the test at cursor.
 */
function runTestAtCursor(editor, testFunctionName, testFunctions, goConfig, cmd, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const testConfigFns = [testFunctionName];
        if (cmd !== 'benchmark' && testUtils_1.extractInstanceTestName(testFunctionName)) {
            testConfigFns.push(...testUtils_1.findAllTestSuiteRuns(editor.document, testFunctions).map((t) => t.name));
        }
        const isMod = yield goModules_1.isModSupported(editor.document.uri);
        const testConfig = {
            goConfig,
            dir: path.dirname(editor.document.fileName),
            flags: testUtils_1.getTestFlags(goConfig, args),
            functions: testConfigFns,
            isBenchmark: cmd === 'benchmark',
            isMod,
            applyCodeCoverage: goConfig.get('coverOnSingleTest')
        };
        // Remember this config as the last executed test.
        lastTestConfig = testConfig;
        return testUtils_1.goTest(testConfig);
    });
}
/**
 * Debugs the test at cursor.
 */
function debugTestAtCursor(editor, testFunctionName, testFunctions, goConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        const args = testUtils_1.getTestFunctionDebugArgs(editor.document, testFunctionName, testFunctions);
        const tags = testUtils_1.getTestTags(goConfig);
        const buildFlags = tags ? ['-tags', tags] : [];
        const flagsFromConfig = testUtils_1.getTestFlags(goConfig);
        let foundArgsFlag = false;
        flagsFromConfig.forEach((x) => {
            if (foundArgsFlag) {
                args.push(x);
                return;
            }
            if (x === '-args') {
                foundArgsFlag = true;
                return;
            }
            buildFlags.push(x);
        });
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        const debugConfig = {
            name: 'Debug Test',
            type: 'go',
            request: 'launch',
            mode: 'auto',
            program: editor.document.fileName,
            env: goConfig.get('testEnvVars', {}),
            envFile: goConfig.get('testEnvFile'),
            args,
            buildFlags: buildFlags.join(' ')
        };
        return yield vscode.debug.startDebugging(workspaceFolder, debugConfig);
    });
}
/**
 * Runs all tests in the package of the source of the active editor.
 *
 * @param goConfig Configuration for the Go extension.
 */
function testCurrentPackage(goConfig, isBenchmark, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active.');
            return;
        }
        const isMod = yield goModules_1.isModSupported(editor.document.uri);
        const testConfig = {
            goConfig,
            dir: path.dirname(editor.document.fileName),
            flags: testUtils_1.getTestFlags(goConfig, args),
            isBenchmark,
            isMod,
            applyCodeCoverage: goConfig.get('coverOnTestPackage')
        };
        // Remember this config as the last executed test.
        lastTestConfig = testConfig;
        return testUtils_1.goTest(testConfig);
    });
}
exports.testCurrentPackage = testCurrentPackage;
/**
 * Runs all tests from all directories in the workspace.
 *
 * @param goConfig Configuration for the Go extension.
 */
function testWorkspace(goConfig, args) {
    if (!vscode.workspace.workspaceFolders.length) {
        vscode.window.showInformationMessage('No workspace is open to run tests.');
        return;
    }
    let workspaceUri = vscode.workspace.workspaceFolders[0].uri;
    if (vscode.window.activeTextEditor &&
        vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)) {
        workspaceUri = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri;
    }
    const testConfig = {
        goConfig,
        dir: workspaceUri.fsPath,
        flags: testUtils_1.getTestFlags(goConfig, args),
        includeSubDirectories: true
    };
    // Remember this config as the last executed test.
    lastTestConfig = testConfig;
    goModules_1.isModSupported(workspaceUri).then((isMod) => {
        testConfig.isMod = isMod;
        testUtils_1.goTest(testConfig).then(null, (err) => {
            console.error(err);
        });
    });
}
exports.testWorkspace = testWorkspace;
/**
 * Runs all tests in the source of the active editor.
 *
 * @param goConfig Configuration for the Go extension.
 * @param isBenchmark Boolean flag indicating if these are benchmark tests or not.
 */
function testCurrentFile(goConfig, isBenchmark, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active.');
            return;
        }
        if (!editor.document.fileName.endsWith('_test.go')) {
            vscode.window.showInformationMessage('No tests found. Current file is not a test file.');
            return;
        }
        const getFunctions = isBenchmark ? testUtils_1.getBenchmarkFunctions : testUtils_1.getTestFunctions;
        const isMod = yield goModules_1.isModSupported(editor.document.uri);
        return editor.document
            .save()
            .then(() => {
            return getFunctions(editor.document, null).then((testFunctions) => {
                const testConfig = {
                    goConfig,
                    dir: path.dirname(editor.document.fileName),
                    flags: testUtils_1.getTestFlags(goConfig, args),
                    functions: testFunctions.map((sym) => sym.name),
                    isBenchmark,
                    isMod,
                    applyCodeCoverage: goConfig.get('coverOnSingleTestFile')
                };
                // Remember this config as the last executed test.
                lastTestConfig = testConfig;
                return testUtils_1.goTest(testConfig);
            });
        })
            .then(null, (err) => {
            console.error(err);
            return Promise.resolve(false);
        });
    });
}
exports.testCurrentFile = testCurrentFile;
/**
 * Runs the previously executed test.
 */
function testPrevious() {
    if (!lastTestConfig) {
        vscode.window.showInformationMessage('No test has been recently executed.');
        return;
    }
    testUtils_1.goTest(lastTestConfig).then(null, (err) => {
        console.error(err);
    });
}
exports.testPrevious = testPrevious;
//# sourceMappingURL=goTest.js.map