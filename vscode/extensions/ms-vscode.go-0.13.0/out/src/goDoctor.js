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
const path_1 = require("path");
const vscode = require("vscode");
const goInstallTools_1 = require("./goInstallTools");
const util_1 = require("./util");
/**
 * Extracts function out of current selection and replaces the current selection with a call to the extracted function.
 */
function extractFunction() {
    extract('extract');
}
exports.extractFunction = extractFunction;
/**
 * Extracts expression out of current selection into a var in the local scope and
 * replaces the current selection with the new var.
 */
function extractVariable() {
    extract('var');
}
exports.extractVariable = extractVariable;
function extract(type) {
    return __awaiter(this, void 0, void 0, function* () {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showInformationMessage('No editor is active.');
            return;
        }
        if (activeEditor.selections.length !== 1) {
            vscode.window.showInformationMessage(`You need to have a single selection for extracting ${type === 'var' ? 'variable' : 'method'}`);
            return;
        }
        const newName = yield vscode.window.showInputBox({
            placeHolder: `Please enter a name for the extracted ${type === 'var' ? 'variable' : 'method'}.`
        });
        if (!newName) {
            return;
        }
        runGoDoctor(newName, activeEditor.selection, activeEditor.document.fileName, type);
    });
}
/**
 * @param newName name for the extracted method
 * @param selection the editor selection from which method is to be extracted
 * @param activeEditor the editor that will be used to apply the changes from godoctor
 * @returns errorMessage in case the method fails, null otherwise
 */
function runGoDoctor(newName, selection, fileName, type) {
    const godoctor = util_1.getBinPath('godoctor');
    return new Promise((resolve, reject) => {
        if (!path_1.isAbsolute(godoctor)) {
            goInstallTools_1.promptForMissingTool('godoctor');
            return resolve();
        }
        cp.execFile(godoctor, [
            '-w',
            '-pos',
            `${selection.start.line + 1},${selection.start.character + 1}:${selection.end.line + 1},${selection.end.character}`,
            '-file',
            fileName,
            type,
            newName
        ], {
            env: util_1.getToolsEnvVars(),
            cwd: path_1.dirname(fileName)
        }, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage(stderr || err.message);
            }
        });
    });
}
//# sourceMappingURL=goDoctor.js.map