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
const cp = require("child_process");
const path = require("path");
const vscode = require("vscode");
const goInstallTools_1 = require("./goInstallTools");
const goOutline_1 = require("./goOutline");
const goStatus_1 = require("./goStatus");
const util_1 = require("./util");
const generatedWord = 'Generated ';
/**
 * If current active editor has a Go file, returns the editor.
 */
function checkActiveEditor() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Cannot generate unit tests. No editor selected.');
        return;
    }
    if (!editor.document.fileName.endsWith('.go')) {
        vscode.window.showInformationMessage('Cannot generate unit tests. File in the editor is not a Go file.');
        return;
    }
    if (editor.document.isDirty) {
        vscode.window.showInformationMessage('File has unsaved changes. Save and try again.');
        return;
    }
    return editor;
}
/**
 * Toggles between file in current active editor and the corresponding test file.
 */
function toggleTestFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Cannot toggle test file. No editor selected.');
        return;
    }
    const currentFilePath = editor.document.fileName;
    if (!currentFilePath.endsWith('.go')) {
        vscode.window.showInformationMessage('Cannot toggle test file. File in the editor is not a Go file.');
        return;
    }
    let targetFilePath = '';
    if (currentFilePath.endsWith('_test.go')) {
        targetFilePath = currentFilePath.substr(0, currentFilePath.lastIndexOf('_test.go')) + '.go';
    }
    else {
        targetFilePath = currentFilePath.substr(0, currentFilePath.lastIndexOf('.go')) + '_test.go';
    }
    for (const doc of vscode.window.visibleTextEditors) {
        if (doc.document.fileName === targetFilePath) {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(targetFilePath), doc.viewColumn);
            return;
        }
    }
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(targetFilePath));
}
exports.toggleTestFile = toggleTestFile;
function generateTestCurrentPackage() {
    const editor = checkActiveEditor();
    if (!editor) {
        return;
    }
    return generateTests({
        dir: path.dirname(editor.document.uri.fsPath),
        isTestFile: editor.document.fileName.endsWith('_test.go')
    }, util_1.getGoConfig(editor.document.uri));
}
exports.generateTestCurrentPackage = generateTestCurrentPackage;
function generateTestCurrentFile() {
    const editor = checkActiveEditor();
    if (!editor) {
        return;
    }
    return generateTests({
        dir: editor.document.uri.fsPath,
        isTestFile: editor.document.fileName.endsWith('_test.go')
    }, util_1.getGoConfig(editor.document.uri));
}
exports.generateTestCurrentFile = generateTestCurrentFile;
function generateTestCurrentFunction() {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = checkActiveEditor();
        if (!editor) {
            return;
        }
        const functions = yield getFunctions(editor.document);
        const selection = editor.selection;
        const currentFunction = functions.find((func) => selection && func.range.contains(selection.start));
        if (!currentFunction) {
            vscode.window.showInformationMessage('No function found at cursor.');
            return Promise.resolve(false);
        }
        let funcName = currentFunction.name;
        const funcNameParts = funcName.match(/^\(\*?(.*)\)\.(.*)$/);
        if (funcNameParts != null && funcNameParts.length === 3) {
            // receiver type specified
            const rType = funcNameParts[1].replace(/^\w/, (c) => c.toUpperCase());
            const fName = funcNameParts[2].replace(/^\w/, (c) => c.toUpperCase());
            funcName = rType + fName;
        }
        return generateTests({
            dir: editor.document.uri.fsPath,
            func: funcName,
            isTestFile: editor.document.fileName.endsWith('_test.go')
        }, util_1.getGoConfig(editor.document.uri));
    });
}
exports.generateTestCurrentFunction = generateTestCurrentFunction;
function generateTests(conf, goConfig) {
    return new Promise((resolve, reject) => {
        const cmd = util_1.getBinPath('gotests');
        let args = ['-w'];
        const goGenerateTestsFlags = goConfig['generateTestsFlags'] || [];
        for (let i = 0; i < goGenerateTestsFlags.length; i++) {
            const flag = goGenerateTestsFlags[i];
            if (flag === '-w' || flag === 'all') {
                continue;
            }
            if (flag === '-only') {
                i++;
                continue;
            }
            args.push(flag);
        }
        if (conf.func) {
            args = args.concat(['-only', `^${conf.func}$`, conf.dir]);
        }
        else {
            args = args.concat(['-all', conf.dir]);
        }
        cp.execFile(cmd, args, { env: util_1.getToolsEnvVars() }, (err, stdout, stderr) => {
            goStatus_1.outputChannel.appendLine('Generating Tests: ' + cmd + ' ' + args.join(' '));
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('gotests');
                    return resolve(false);
                }
                if (err) {
                    console.log(err);
                    goStatus_1.outputChannel.appendLine(err.message);
                    return reject('Cannot generate test due to errors');
                }
                let message = stdout;
                let testsGenerated = false;
                // Expected stdout is of the format "Generated TestMain\nGenerated Testhello\n"
                if (stdout.startsWith(generatedWord)) {
                    const lines = stdout
                        .split('\n')
                        .filter((element) => {
                        return element.startsWith(generatedWord);
                    })
                        .map((element) => {
                        return element.substr(generatedWord.length);
                    });
                    message = `Generated ${lines.join(', ')}`;
                    testsGenerated = true;
                }
                vscode.window.showInformationMessage(message);
                goStatus_1.outputChannel.append(message);
                if (testsGenerated && !conf.isTestFile) {
                    toggleTestFile();
                }
                return resolve(true);
            }
            catch (e) {
                vscode.window.showInformationMessage(e.msg);
                goStatus_1.outputChannel.append(e.msg);
                reject(e);
            }
        });
    });
}
function getFunctions(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider();
        const symbols = yield documentSymbolProvider.provideDocumentSymbols(doc, null);
        return symbols[0].children.filter((sym) => sym.kind === vscode.SymbolKind.Function);
    });
}
//# sourceMappingURL=goGenerateTests.js.map