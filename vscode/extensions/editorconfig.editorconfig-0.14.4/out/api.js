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
const editorconfig = require("editorconfig");
const get = require("lodash.get");
const vscode_1 = require("vscode");
const languageExtensionMap_1 = require("./languageExtensionMap");
/**
 * Resolves `TextEditorOptions` for a `TextDocument`, combining the editor's
 * default configuration with that of EditorConfig's configuration.
 */
function resolveTextEditorOptions(doc, { defaults = pickWorkspaceDefaults(), onBeforeResolve, onEmptyConfig, } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const editorconfigSettings = yield resolveCoreConfig(doc, {
            onBeforeResolve,
        });
        if (editorconfigSettings) {
            return fromEditorConfig(editorconfigSettings, defaults);
        }
        if (onEmptyConfig) {
            const rp = resolveFile(doc).relativePath;
            if (rp) {
                onEmptyConfig(rp);
            }
        }
        return {};
    });
}
exports.resolveTextEditorOptions = resolveTextEditorOptions;
/**
 * Applies new `TextEditorOptions` to the active text editor.
 */
function applyTextEditorOptions(newOptions, { onNoActiveTextEditor, onSuccess, } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            if (onNoActiveTextEditor) {
                onNoActiveTextEditor();
            }
            return;
        }
        editor.options = newOptions;
        if (onSuccess) {
            onSuccess(newOptions);
        }
    });
}
exports.applyTextEditorOptions = applyTextEditorOptions;
/**
 * Picks EditorConfig-relevant props from the editor's default configuration.
 */
function pickWorkspaceDefaults() {
    const workspaceConfig = vscode_1.workspace.getConfiguration('editor', null);
    const detectIndentation = workspaceConfig.get('detectIndentation');
    return detectIndentation
        ? {}
        : {
            tabSize: workspaceConfig.get('tabSize'),
            insertSpaces: workspaceConfig.get('insertSpaces'),
        };
}
exports.pickWorkspaceDefaults = pickWorkspaceDefaults;
/**
 * Resolves an EditorConfig configuration for the file related to a
 * `TextDocument`.
 */
function resolveCoreConfig(doc, { onBeforeResolve, } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const { fileName, relativePath } = resolveFile(doc);
        if (!fileName) {
            return {};
        }
        if (onBeforeResolve && relativePath) {
            onBeforeResolve(relativePath);
        }
        const config = yield editorconfig.parse(fileName);
        if (config.indent_size === 'tab') {
            config.indent_size = config.tab_width;
        }
        return config;
    });
}
exports.resolveCoreConfig = resolveCoreConfig;
function resolveFile(doc) {
    if (doc.languageId === 'Log') {
        return {};
    }
    const file = getFile();
    return {
        fileName: file && file.toString(),
        relativePath: file && vscode_1.workspace.asRelativePath(file, true),
    };
    function getFile() {
        if (!doc.isUntitled) {
            return doc.fileName;
        }
        const ext = languageExtensionMap_1.default[doc.languageId] || doc.languageId;
        const folder = vscode_1.workspace.getWorkspaceFolder(doc.uri);
        return (folder &&
            folder.uri.with({
                path: `${doc.fileName}.${ext}`,
            }));
    }
}
exports.resolveFile = resolveFile;
/**
 * Convert .editorconfig values to vscode editor options
 */
function fromEditorConfig(config = {}, defaults = pickWorkspaceDefaults()) {
    const resolved = {
        tabSize: config.indent_style === 'tab'
            ? get(config, 'tab_width', config.indent_size)
            : get(config, 'indent_size', config.tab_width),
    };
    if (get(resolved, 'tabSize') === 'tab') {
        resolved.tabSize = config.tab_width;
    }
    return Object.assign(Object.assign({}, (config.indent_style === 'tab' ||
        config.indent_size === 'tab' ||
        config.indent_style === 'space'
        ? {
            insertSpaces: config.indent_style === 'space',
        }
        : {})), { tabSize: resolved.tabSize && resolved.tabSize >= 0
            ? resolved.tabSize
            : defaults.tabSize });
}
exports.fromEditorConfig = fromEditorConfig;
/**
 * Convert vscode editor options to .editorconfig values
 */
function toEditorConfig(options) {
    const result = {};
    switch (options.insertSpaces) {
        case true:
            result.indent_style = 'space';
            if (options.tabSize) {
                result.indent_size = resolveTabSize(options.tabSize);
            }
            break;
        case false:
        case 'auto':
            result.indent_style = 'tab';
            if (options.tabSize) {
                result.tab_width = resolveTabSize(options.tabSize);
            }
            break;
    }
    return result;
    /**
     * Convert vscode tabSize option into numeric value
     */
    function resolveTabSize(tabSize) {
        return tabSize === 'auto' ? 4 : parseInt(String(tabSize), 10);
    }
}
exports.toEditorConfig = toEditorConfig;
//# sourceMappingURL=api.js.map