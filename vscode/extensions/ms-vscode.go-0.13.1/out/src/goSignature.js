/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
const vscode_1 = require("vscode");
const goDeclaration_1 = require("./goDeclaration");
const util_1 = require("./util");
class GoSignatureHelpProvider {
    constructor(goConfig) {
        this.goConfig = goConfig;
    }
    provideSignatureHelp(document, position, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let goConfig = this.goConfig || util_1.getGoConfig(document.uri);
            const theCall = this.walkBackwardsToBeginningOfCall(document, position);
            if (theCall == null) {
                return Promise.resolve(null);
            }
            const callerPos = this.previousTokenPosition(document, theCall.openParen);
            // Temporary fix to fall back to godoc if guru is the set docsTool
            if (goConfig['docsTool'] === 'guru') {
                goConfig = Object.assign({}, goConfig, { docsTool: 'godoc' });
            }
            try {
                const res = yield goDeclaration_1.definitionLocation(document, callerPos, goConfig, true, token);
                if (!res) {
                    // The definition was not found
                    return null;
                }
                if (res.line === callerPos.line) {
                    // This must be a function definition
                    return null;
                }
                let declarationText = (res.declarationlines || []).join(' ').trim();
                if (!declarationText) {
                    return null;
                }
                const result = new vscode_1.SignatureHelp();
                let sig;
                let si;
                if (res.toolUsed === 'godef') {
                    // declaration is of the form "Add func(a int, b int) int"
                    const nameEnd = declarationText.indexOf(' ');
                    const sigStart = nameEnd + 5; // ' func'
                    const funcName = declarationText.substring(0, nameEnd);
                    sig = declarationText.substring(sigStart);
                    si = new vscode_1.SignatureInformation(funcName + sig, res.doc);
                }
                else if (res.toolUsed === 'gogetdoc') {
                    // declaration is of the form "func Add(a int, b int) int"
                    declarationText = declarationText.substring(5);
                    const funcNameStart = declarationText.indexOf(res.name + '('); // Find 'functionname(' to remove anything before it
                    if (funcNameStart > 0) {
                        declarationText = declarationText.substring(funcNameStart);
                    }
                    si = new vscode_1.SignatureInformation(declarationText, res.doc);
                    sig = declarationText.substring(res.name.length);
                }
                si.parameters = util_1.getParametersAndReturnType(sig).params.map((paramText) => new vscode_1.ParameterInformation(paramText));
                result.signatures = [si];
                result.activeSignature = 0;
                result.activeParameter = Math.min(theCall.commas.length, si.parameters.length - 1);
                return result;
            }
            catch (e) {
                return null;
            }
        });
    }
    previousTokenPosition(document, position) {
        while (position.character > 0) {
            const word = document.getWordRangeAtPosition(position);
            if (word) {
                return word.start;
            }
            position = position.translate(0, -1);
        }
        return null;
    }
    /**
     * Goes through the function params' lines and gets the number of commas and the start position of the call.
     */
    walkBackwardsToBeginningOfCall(document, position) {
        let parenBalance = 0;
        let maxLookupLines = 30;
        const commas = [];
        for (let lineNr = position.line; lineNr >= 0 && maxLookupLines >= 0; lineNr--, maxLookupLines--) {
            const line = document.lineAt(lineNr);
            // Stop processing if we're inside a comment
            if (util_1.isPositionInComment(document, position)) {
                return null;
            }
            // if its current line, get the text until the position given, otherwise get the full line.
            const [currentLine, characterPosition] = lineNr === position.line
                ? [line.text.substring(0, position.character), position.character]
                : [line.text, line.text.length - 1];
            for (let char = characterPosition; char >= 0; char--) {
                switch (currentLine[char]) {
                    case '(':
                        parenBalance--;
                        if (parenBalance < 0) {
                            return {
                                openParen: new vscode_1.Position(lineNr, char),
                                commas
                            };
                        }
                        break;
                    case ')':
                        parenBalance++;
                        break;
                    case ',':
                        const commaPos = new vscode_1.Position(lineNr, char);
                        if (parenBalance === 0 && !util_1.isPositionInString(document, commaPos)) {
                            commas.push(commaPos);
                        }
                        break;
                }
            }
        }
        return null;
    }
}
exports.GoSignatureHelpProvider = GoSignatureHelpProvider;
//# sourceMappingURL=goSignature.js.map