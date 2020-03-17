"use strict";
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
/**
 * Generate a .editorconfig file in the root of the workspace based on the
 * current vscode settings.
 */
function generateEditorConfig(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceUri = vscode_1.workspace.workspaceFolders && vscode_1.workspace.workspaceFolders[0].uri;
        const currentUri = uri || workspaceUri;
        if (!currentUri) {
            vscode_1.window.showErrorMessage("Workspace doesn't contain any folders.");
            return;
        }
        const editorConfigUri = vscode_1.Uri.parse(`${currentUri.toString()}/.editorconfig`);
        try {
            const stats = yield vscode_1.workspace.fs.stat(editorConfigUri);
            if (stats.type === vscode_1.FileType.File) {
                vscode_1.window.showErrorMessage('An .editorconfig file already exists in this workspace.');
                return;
            }
        }
        catch (err) {
            if (err) {
                if (err.name === 'EntryNotFound (FileSystemError)') {
                    writeFile();
                }
                else {
                    vscode_1.window.showErrorMessage(err.message);
                }
                return;
            }
        }
        function writeFile() {
            return __awaiter(this, void 0, void 0, function* () {
                const editor = vscode_1.workspace.getConfiguration('editor', currentUri);
                const files = vscode_1.workspace.getConfiguration('files', currentUri);
                const settingsLines = ['root = true', '', '[*]'];
                function addSetting(key, value) {
                    if (value !== undefined) {
                        settingsLines.push(`${key} = ${value}`);
                    }
                }
                const insertSpaces = editor.get('insertSpaces');
                addSetting('indent_style', insertSpaces ? 'space' : 'tab');
                addSetting('indent_size', editor.get('tabSize'));
                const eolMap = {
                    '\r\n': 'crlf',
                    '\n': 'lf',
                };
                addSetting('end_of_line', eolMap[files.get('eol')]);
                const encodingMap = {
                    iso88591: 'latin1',
                    utf8: 'utf-8',
                    utf8bom: 'utf-8-bom',
                    utf16be: 'utf-16-be',
                    utf16le: 'utf-16-le',
                };
                addSetting('charset', encodingMap[files.get('encoding')]);
                addSetting('trim_trailing_whitespace', files.get('trimTrailingWhitespace'));
                const insertFinalNewline = files.get('insertFinalNewline');
                addSetting('insert_final_newline', insertFinalNewline);
                if (insertFinalNewline) {
                    settingsLines.push('');
                }
                try {
                    yield vscode_1.workspace.fs.writeFile(editorConfigUri, Buffer.from(settingsLines.join('\n')));
                }
                catch (err) {
                    if (err) {
                        vscode_1.window.showErrorMessage(err.message);
                        return;
                    }
                }
            });
        }
    });
}
exports.generateEditorConfig = generateEditorConfig;
//# sourceMappingURL=generateEditorConfig.js.map