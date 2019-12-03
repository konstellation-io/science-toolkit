/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class GoRefactorProvider {
    provideCodeActions(document, range, context, token) {
        if (range.isEmpty) {
            return [];
        }
        const extractFunction = new vscode.CodeAction('Extract to function in package scope', vscode.CodeActionKind.RefactorExtract);
        const extractVar = new vscode.CodeAction('Extract to variable in local scope', vscode.CodeActionKind.RefactorExtract);
        extractFunction.command = {
            title: 'Extract to function in package scope',
            command: 'go.godoctor.extract'
        };
        extractVar.command = {
            title: 'Extract to variable in local scope',
            command: 'go.godoctor.var'
        };
        return [extractFunction, extractVar];
    }
}
exports.GoRefactorProvider = GoRefactorProvider;
//# sourceMappingURL=goRefactor.js.map