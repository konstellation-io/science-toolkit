"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get = require("lodash.get");
const vscode_1 = require("vscode");
const PreSaveTransformation_1 = require("./PreSaveTransformation");
const lineEndings = {
    CR: '\r',
    CRLF: '\r\n',
    LF: '\n',
};
class InsertFinalNewline extends PreSaveTransformation_1.default {
    constructor() {
        super(...arguments);
        this.lineEndings = lineEndings;
    }
    transform(editorconfigProperties, doc) {
        const lineCount = doc.lineCount;
        const lastLine = doc.lineAt(lineCount - 1);
        if (shouldIgnoreSetting(editorconfigProperties.insert_final_newline) ||
            lineCount === 0 ||
            lastLine.isEmptyOrWhitespace) {
            return { edits: [] };
        }
        const position = new vscode_1.Position(lastLine.lineNumber, lastLine.text.length);
        const eol = get(editorconfigProperties, 'end_of_line', 'lf').toUpperCase();
        return {
            edits: [
                vscode_1.TextEdit.insert(position, this.lineEndings[eol]),
            ],
            message: `insertFinalNewline(${eol})`,
        };
        function shouldIgnoreSetting(value) {
            return !value || value === 'unset';
        }
    }
}
exports.default = InsertFinalNewline;
//# sourceMappingURL=InsertFinalNewline.js.map