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
const get = require("lodash.get");
const path = require("path");
const vscode_1 = require("vscode");
const transformations_1 = require("./transformations");
const api_1 = require("./api");
class DocumentWatcher {
    constructor(outputChannel = vscode_1.window.createOutputChannel('EditorConfig')) {
        this.outputChannel = outputChannel;
        this.preSaveTransformations = [
            new transformations_1.SetEndOfLine(),
            new transformations_1.TrimTrailingWhitespace(),
            new transformations_1.InsertFinalNewline(),
        ];
        this.onEmptyConfig = (relativePath) => {
            this.log(`${relativePath}: No configuration.`);
        };
        this.onBeforeResolve = (relativePath) => {
            this.log(`${relativePath}: Using EditorConfig core...`);
        };
        this.onNoActiveTextEditor = () => {
            this.log('No more open editors.');
        };
        this.onSuccess = (newOptions) => {
            if (!this.doc) {
                this.log(`[no file]: ${JSON.stringify(newOptions)}`);
                return;
            }
            const { relativePath } = api_1.resolveFile(this.doc);
            this.log(`${relativePath}: ${JSON.stringify(newOptions)}`);
        };
        this.log('Initializing document watcher...');
        const subscriptions = [];
        subscriptions.push(vscode_1.window.onDidChangeActiveTextEditor((editor) => __awaiter(this, void 0, void 0, function* () {
            if (editor && editor.document) {
                const newOptions = yield api_1.resolveTextEditorOptions((this.doc = editor.document), {
                    onEmptyConfig: this.onEmptyConfig,
                });
                api_1.applyTextEditorOptions(newOptions, {
                    onNoActiveTextEditor: this.onNoActiveTextEditor,
                    onSuccess: this.onSuccess,
                });
            }
        })));
        subscriptions.push(vscode_1.window.onDidChangeWindowState((state) => __awaiter(this, void 0, void 0, function* () {
            if (state.focused && this.doc) {
                const newOptions = yield api_1.resolveTextEditorOptions(this.doc, {
                    onEmptyConfig: this.onEmptyConfig,
                });
                api_1.applyTextEditorOptions(newOptions, {
                    onNoActiveTextEditor: this.onNoActiveTextEditor,
                    onSuccess: this.onSuccess,
                });
            }
        })));
        subscriptions.push(vscode_1.workspace.onDidSaveTextDocument(doc => {
            if (path.basename(doc.fileName) === '.editorconfig') {
                this.log('.editorconfig file saved.');
            }
        }));
        subscriptions.push(vscode_1.workspace.onWillSaveTextDocument((e) => __awaiter(this, void 0, void 0, function* () {
            let selections = [];
            const activeEditor = vscode_1.window.activeTextEditor;
            const activeDoc = get(activeEditor, 'document');
            if (activeDoc && activeDoc === e.document && activeEditor) {
                selections = activeEditor.selections;
            }
            const transformations = this.calculatePreSaveTransformations(e.document, e.reason);
            e.waitUntil(transformations);
            if (selections.length) {
                const edits = yield transformations;
                if (activeEditor && edits.length > 0) {
                    activeEditor.selections = selections;
                }
            }
        })));
        this.disposable = vscode_1.Disposable.from.apply(this, subscriptions);
    }
    log(...messages) {
        this.outputChannel.appendLine(messages.join(' '));
    }
    dispose() {
        this.disposable.dispose();
    }
    calculatePreSaveTransformations(doc, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const editorconfigSettings = yield api_1.resolveCoreConfig(doc, {
                onBeforeResolve: this.onBeforeResolve,
            });
            const relativePath = vscode_1.workspace.asRelativePath(doc.fileName);
            if (!editorconfigSettings) {
                this.log(`${relativePath}: No configuration found for pre-save.`);
                return [];
            }
            return Array.prototype.concat.call([], ...this.preSaveTransformations.map(transformer => {
                const { edits, message } = transformer.transform(editorconfigSettings, doc, reason);
                if (edits instanceof Error) {
                    this.log(`${relativePath}: ${edits.message}`);
                }
                if (message) {
                    this.log(`${relativePath}: ${message}`);
                }
                return edits;
            }));
        });
    }
}
exports.default = DocumentWatcher;
//# sourceMappingURL=DocumentWatcher.js.map