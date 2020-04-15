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
const moment = require("moment");
const path = require("path");
const semver = require("semver");
const util = require("util");
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const WebRequest = require("web-request");
const goDeclaration_1 = require("./goDeclaration");
const goExtraInfo_1 = require("./goExtraInfo");
const goFormat_1 = require("./goFormat");
const goImplementations_1 = require("./goImplementations");
const goInstallTools_1 = require("./goInstallTools");
const goLiveErrors_1 = require("./goLiveErrors");
const goMode_1 = require("./goMode");
const goOutline_1 = require("./goOutline");
const goPath_1 = require("./goPath");
const goReferences_1 = require("./goReferences");
const goRename_1 = require("./goRename");
const goSignature_1 = require("./goSignature");
const goSuggest_1 = require("./goSuggest");
const goSymbol_1 = require("./goSymbol");
const goTools_1 = require("./goTools");
const goTypeDefinition_1 = require("./goTypeDefinition");
const util_1 = require("./util");
// registerLanguageFeatures registers providers for all the language features.
// It looks to either the language server or the standard providers for these features.
function registerLanguageFeatures(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        // Subscribe to notifications for changes to the configuration of the language server.
        ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => watchLanguageServerConfiguration(e)));
        const config = parseLanguageServerConfig();
        // If the user has not enabled the language server,
        // register the default language features and return.
        if (!config.enabled) {
            registerUsualProviders(ctx);
            return;
        }
        // The user has opted into the language server.
        const languageServerToolPath = getLanguageServerToolPath();
        const toolName = goPath_1.getToolFromToolPath(languageServerToolPath);
        if (!toolName) {
            // language server binary is not installed yet.
            // Return immediately. The information messages such as
            // offering to install missing tools, and suggesting to
            // reload the window after installing the language server
            // should be presented by now.
            return;
        }
        const env = util_1.getToolsEnvVars();
        // If installed, check. The user may not have the most up-to-date version of the language server.
        const tool = goTools_1.getTool(toolName);
        const update = yield shouldUpdateLanguageServer(tool, languageServerToolPath, config.checkForUpdates);
        if (update) {
            goInstallTools_1.promptForUpdatingTool(toolName);
        }
        const c = new vscode_languageclient_1.LanguageClient(toolName, {
            command: languageServerToolPath,
            args: ['-mode=stdio', ...config.flags],
            options: { env }
        }, {
            initializationOptions: {},
            documentSelector: ['go', 'go.mod', 'go.sum'],
            uriConverters: {
                // Apply file:/// scheme to all file paths.
                code2Protocol: (uri) => (uri.scheme ? uri : uri.with({ scheme: 'file' })).toString(),
                protocol2Code: (uri) => vscode.Uri.parse(uri)
            },
            revealOutputChannelOn: vscode_languageclient_1.RevealOutputChannelOn.Never,
            middleware: {
                provideDocumentFormattingEdits: (document, options, token, next) => {
                    if (!config.features.format) {
                        return [];
                    }
                    return next(document, options, token);
                },
                handleDiagnostics: (uri, diagnostics, next) => {
                    if (!config.features.diagnostics) {
                        return null;
                    }
                    return next(uri, diagnostics);
                },
                provideDocumentLinks: (document, token, next) => {
                    if (!config.features.documentLink) {
                        return null;
                    }
                    return next(document, token);
                }
            }
        });
        c.onReady().then(() => {
            const capabilities = c.initializeResult && c.initializeResult.capabilities;
            if (!capabilities) {
                return vscode.window.showErrorMessage('The language server is not able to serve any features at the moment.');
            }
            // Fallback to default providers for unsupported or disabled features.
            if (!capabilities.completionProvider) {
                const provider = new goSuggest_1.GoCompletionItemProvider(ctx.globalState);
                ctx.subscriptions.push(provider);
                ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(goMode_1.GO_MODE, provider, '.', '"'));
            }
            if (!config.features.format || !capabilities.documentFormattingProvider) {
                ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(goMode_1.GO_MODE, new goFormat_1.GoDocumentFormattingEditProvider()));
            }
            if (!capabilities.renameProvider) {
                ctx.subscriptions.push(vscode.languages.registerRenameProvider(goMode_1.GO_MODE, new goRename_1.GoRenameProvider()));
            }
            if (!capabilities.typeDefinitionProvider) {
                ctx.subscriptions.push(vscode.languages.registerTypeDefinitionProvider(goMode_1.GO_MODE, new goTypeDefinition_1.GoTypeDefinitionProvider()));
            }
            if (!capabilities.hoverProvider) {
                ctx.subscriptions.push(vscode.languages.registerHoverProvider(goMode_1.GO_MODE, new goExtraInfo_1.GoHoverProvider()));
            }
            if (!capabilities.definitionProvider) {
                ctx.subscriptions.push(vscode.languages.registerDefinitionProvider(goMode_1.GO_MODE, new goDeclaration_1.GoDefinitionProvider()));
            }
            if (!capabilities.referencesProvider) {
                ctx.subscriptions.push(vscode.languages.registerReferenceProvider(goMode_1.GO_MODE, new goReferences_1.GoReferenceProvider()));
            }
            if (!capabilities.documentSymbolProvider) {
                ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(goMode_1.GO_MODE, new goOutline_1.GoDocumentSymbolProvider()));
            }
            if (!capabilities.signatureHelpProvider) {
                ctx.subscriptions.push(vscode.languages.registerSignatureHelpProvider(goMode_1.GO_MODE, new goSignature_1.GoSignatureHelpProvider(), '(', ','));
            }
            if (!capabilities.workspaceSymbolProvider) {
                ctx.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new goSymbol_1.GoWorkspaceSymbolProvider()));
            }
            if (!capabilities.implementationProvider) {
                ctx.subscriptions.push(vscode.languages.registerImplementationProvider(goMode_1.GO_MODE, new goImplementations_1.GoImplementationProvider()));
            }
        });
        let languageServerDisposable = c.start();
        ctx.subscriptions.push(languageServerDisposable);
        ctx.subscriptions.push(vscode.commands.registerCommand('go.languageserver.restart', () => __awaiter(this, void 0, void 0, function* () {
            if (c.diagnostics) {
                c.diagnostics.clear();
            }
            yield c.stop();
            languageServerDisposable.dispose();
            languageServerDisposable = c.start();
            ctx.subscriptions.push(languageServerDisposable);
        })));
        // gopls is the only language server that provides live diagnostics on type,
        // so use gotype if it's not enabled.
        if (!(toolName === 'gopls' && config.features['diagnostics'])) {
            vscode.workspace.onDidChangeTextDocument(goLiveErrors_1.parseLiveFile, null, ctx.subscriptions);
        }
    });
}
exports.registerLanguageFeatures = registerLanguageFeatures;
function watchLanguageServerConfiguration(e) {
    if (!e.affectsConfiguration('go')) {
        return;
    }
    const config = parseLanguageServerConfig();
    let reloadMessage;
    // If the user has disabled or enabled the language server.
    if (e.affectsConfiguration('go.useLanguageServer')) {
        if (config.enabled) {
            reloadMessage = 'Reload VS Code window to enable the use of language server';
        }
        else {
            reloadMessage = 'Reload VS Code window to disable the use of language server';
        }
    }
    if (e.affectsConfiguration('go.languageServerFlags') ||
        e.affectsConfiguration('go.languageServerExperimentalFeatures')) {
        reloadMessage = 'Reload VS Code window for the changes in language server settings to take effect';
    }
    // If there was a change in the configuration of the language server,
    // then ask the user to reload VS Code.
    if (reloadMessage) {
        vscode.window.showInformationMessage(reloadMessage, 'Reload').then((selected) => {
            if (selected === 'Reload') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        });
    }
}
function parseLanguageServerConfig() {
    const goConfig = util_1.getGoConfig();
    const config = {
        enabled: goConfig['useLanguageServer'],
        flags: goConfig['languageServerFlags'] || [],
        features: {
            // TODO: We should have configs that match these names.
            // Ultimately, we should have a centralized language server config rather than separate fields.
            diagnostics: goConfig['languageServerExperimentalFeatures']['diagnostics'],
            format: goConfig['languageServerExperimentalFeatures']['format'],
            documentLink: goConfig['languageServerExperimentalFeatures']['documentLink'],
            highlight: goConfig['languageServerExperimentalFeatures']['highlight']
        },
        checkForUpdates: goConfig['useGoProxyToCheckForToolUpdates']
    };
    return config;
}
exports.parseLanguageServerConfig = parseLanguageServerConfig;
/**
 * Get the absolute path to the language server to be used.
 * If the required tool is not available, then user is prompted to install it.
 * This supports the language servers from both Google and Sourcegraph with the
 * former getting a precedence over the latter
 */
function getLanguageServerToolPath() {
    // If language server is not enabled, return
    const goConfig = util_1.getGoConfig();
    if (!goConfig['useLanguageServer']) {
        return;
    }
    // Check that all workspace folders are configured with the same GOPATH.
    if (!allFoldersHaveSameGopath()) {
        vscode.window.showInformationMessage('The Go language server is currently not supported in a multi-root set-up with different GOPATHs.');
        return;
    }
    // Get the path to gopls or any alternative that the user might have set for gopls.
    const goplsBinaryPath = util_1.getBinPath('gopls');
    if (path.isAbsolute(goplsBinaryPath)) {
        return goplsBinaryPath;
    }
    // Get the path to go-langserver or any alternative that the user might have set for go-langserver.
    const golangserverBinaryPath = util_1.getBinPath('go-langserver');
    if (path.isAbsolute(golangserverBinaryPath)) {
        return golangserverBinaryPath;
    }
    // If no language server path has been found, notify the user.
    let languageServerOfChoice = 'gopls';
    if (goConfig['alternateTools']) {
        const goplsAlternate = goConfig['alternateTools']['gopls'];
        const golangserverAlternate = goConfig['alternateTools']['go-langserver'];
        if (typeof goplsAlternate === 'string') {
            languageServerOfChoice = goPath_1.getToolFromToolPath(goplsAlternate);
        }
        else if (typeof golangserverAlternate === 'string') {
            languageServerOfChoice = goPath_1.getToolFromToolPath(golangserverAlternate);
        }
    }
    // Only gopls and go-langserver are supported.
    if (languageServerOfChoice !== 'gopls' && languageServerOfChoice !== 'go-langserver') {
        vscode.window.showErrorMessage(`Cannot find the language server ${languageServerOfChoice}. Please install it and reload this VS Code window`);
        return;
    }
    // Otherwise, prompt the user to install the language server.
    goInstallTools_1.promptForMissingTool(languageServerOfChoice);
    vscode.window.showInformationMessage('Reload VS Code window after installing the Go language server.');
}
exports.getLanguageServerToolPath = getLanguageServerToolPath;
function allFoldersHaveSameGopath() {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length <= 1) {
        return true;
    }
    const tempGopath = util_1.getCurrentGoPath(vscode.workspace.workspaceFolders[0].uri);
    return vscode.workspace.workspaceFolders.find((x) => tempGopath !== util_1.getCurrentGoPath(x.uri)) ? false : true;
}
// registerUsualProviders registers the language feature providers if the language server is not enabled.
function registerUsualProviders(ctx) {
    const provider = new goSuggest_1.GoCompletionItemProvider(ctx.globalState);
    ctx.subscriptions.push(provider);
    ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(goMode_1.GO_MODE, provider, '.', '"'));
    ctx.subscriptions.push(vscode.languages.registerHoverProvider(goMode_1.GO_MODE, new goExtraInfo_1.GoHoverProvider()));
    ctx.subscriptions.push(vscode.languages.registerDefinitionProvider(goMode_1.GO_MODE, new goDeclaration_1.GoDefinitionProvider()));
    ctx.subscriptions.push(vscode.languages.registerReferenceProvider(goMode_1.GO_MODE, new goReferences_1.GoReferenceProvider()));
    ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(goMode_1.GO_MODE, new goOutline_1.GoDocumentSymbolProvider()));
    ctx.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new goSymbol_1.GoWorkspaceSymbolProvider()));
    ctx.subscriptions.push(vscode.languages.registerSignatureHelpProvider(goMode_1.GO_MODE, new goSignature_1.GoSignatureHelpProvider(), '(', ','));
    ctx.subscriptions.push(vscode.languages.registerImplementationProvider(goMode_1.GO_MODE, new goImplementations_1.GoImplementationProvider()));
    ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(goMode_1.GO_MODE, new goFormat_1.GoDocumentFormattingEditProvider()));
    ctx.subscriptions.push(vscode.languages.registerTypeDefinitionProvider(goMode_1.GO_MODE, new goTypeDefinition_1.GoTypeDefinitionProvider()));
    ctx.subscriptions.push(vscode.languages.registerRenameProvider(goMode_1.GO_MODE, new goRename_1.GoRenameProvider()));
    vscode.workspace.onDidChangeTextDocument(goLiveErrors_1.parseLiveFile, null, ctx.subscriptions);
}
const defaultLatestVersion = semver.coerce('0.1.7');
const defaultLatestVersionTime = moment('2019-09-18', 'YYYY-MM-DD');
function shouldUpdateLanguageServer(tool, languageServerToolPath, makeProxyCall) {
    return __awaiter(this, void 0, void 0, function* () {
        // Only support updating gopls for now.
        if (tool.name !== 'gopls') {
            return false;
        }
        // First, run the "gopls version" command and parse its results.
        // If "gopls" is so old that it doesn't have the "gopls version" command,
        // or its version doesn't match our expectations, prompt the user to download.
        const usersVersion = yield goplsVersion(languageServerToolPath);
        if (!usersVersion) {
            return true;
        }
        // We might have a developer version. Don't make the user update.
        if (usersVersion === '(devel)') {
            return false;
        }
        // Get the latest gopls version.
        let latestVersion = makeProxyCall ? yield latestGopls(tool) : defaultLatestVersion;
        // If we failed to get the gopls version, pick the one we know to be latest at the time of this extension's last update
        if (!latestVersion) {
            latestVersion = defaultLatestVersion;
        }
        // The user may have downloaded golang.org/x/tools/gopls@master,
        // which means that they have a pseudoversion.
        const usersTime = parsePseudoversionTimestamp(usersVersion);
        // If the user has a pseudoversion, get the timestamp for the latest gopls version and compare.
        if (usersTime) {
            let latestTime = makeProxyCall ? yield goplsVersionTimestamp(tool, latestVersion) : defaultLatestVersionTime;
            if (!latestTime) {
                latestTime = defaultLatestVersionTime;
            }
            return usersTime.isBefore(latestTime);
        }
        // If the user's version does not contain a timestamp,
        // default to a semver comparison of the two versions.
        return semver.lt(usersVersion, latestVersion);
    });
}
// Copied from src/cmd/go/internal/modfetch.
const pseudoVersionRE = /^v[0-9]+\.(0\.0-|\d+\.\d+-([^+]*\.)?0\.)\d{14}-[A-Za-z0-9]+(\+incompatible)?$/;
// parsePseudoVersion reports whether v is a pseudo-version.
// The timestamp is the center component, and it has the format "YYYYMMDDHHmmss".
function parsePseudoversionTimestamp(version) {
    const split = version.split('-');
    if (split.length < 2) {
        return null;
    }
    if (!semver.valid(version)) {
        return null;
    }
    if (!pseudoVersionRE.test(version)) {
        return null;
    }
    const sv = semver.coerce(version);
    if (!sv) {
        return null;
    }
    // Copied from src/cmd/go/internal/modfetch.go.
    const build = sv.build.join('.');
    const buildIndex = version.lastIndexOf(build);
    if (buildIndex >= 0) {
        version = version.substring(0, buildIndex);
    }
    const lastDashIndex = version.lastIndexOf('-');
    version = version.substring(0, lastDashIndex);
    const firstDashIndex = version.lastIndexOf('-');
    const dotIndex = version.lastIndexOf('.');
    let timestamp;
    if (dotIndex > firstDashIndex) {
        // "vX.Y.Z-pre.0" or "vX.Y.(Z+1)-0"
        timestamp = version.substring(dotIndex + 1);
    }
    else {
        // "vX.0.0"
        timestamp = version.substring(firstDashIndex + 1);
    }
    return moment.utc(timestamp, 'YYYYMMDDHHmmss');
}
function goplsVersionTimestamp(tool, version) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield goProxyRequest(tool, `v${version.format()}.info`);
        if (!data) {
            return null;
        }
        const time = moment(data['Time']);
        return time;
    });
}
function latestGopls(tool) {
    return __awaiter(this, void 0, void 0, function* () {
        // If the user has a version of gopls that we understand,
        // ask the proxy for the latest version, and if the user's version is older,
        // prompt them to update.
        const data = yield goProxyRequest(tool, 'list');
        if (!data) {
            return null;
        }
        // Coerce the versions into SemVers so that they can be sorted correctly.
        const versions = [];
        for (const version of data.trim().split('\n')) {
            const parsed = semver.parse(version, {
                includePrerelease: true,
                loose: true
            });
            versions.push(parsed);
        }
        if (versions.length === 0) {
            return null;
        }
        versions.sort(semver.rcompare);
        // The first version in the sorted list without a prerelease tag.
        return versions.find((version) => !version.prerelease || !version.prerelease.length);
    });
}
function goplsVersion(goplsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const env = util_1.getToolsEnvVars();
        const execFile = util.promisify(cp.execFile);
        let output;
        try {
            const { stdout } = yield execFile(goplsPath, ['version'], { env });
            output = stdout;
        }
        catch (e) {
            // The "gopls version" command is not supported, or something else went wrong.
            // TODO: Should we propagate this error?
            return null;
        }
        const lines = output.trim().split('\n');
        switch (lines.length) {
            case 0:
                // No results, should update.
                // Worth doing anything here?
                return null;
            case 1:
                // Built in $GOPATH mode. Should update.
                // TODO: Should we check the Go version here?
                // Do we even allow users to enable gopls if their Go version is too low?
                return null;
            case 2:
                // We might actually have a parseable version.
                break;
            default:
                return null;
        }
        // The second line should be the sum line.
        // It should look something like this:
        //
        //    golang.org/x/tools/gopls@v0.1.3 h1:CB5ECiPysqZrwxcyRjN+exyZpY0gODTZvNiqQi3lpeo=
        //
        // TODO: We should use a regex to match this, but for now, we split on the @ symbol.
        // The reasoning for this is that gopls still has a golang.org/x/tools/cmd/gopls binary,
        // so users may have a developer version that looks like "golang.org/x/tools@(devel)".
        const moduleVersion = lines[1].trim().split(' ')[0];
        // Get the relevant portion, that is:
        //
        //    golang.org/x/tools/gopls@v0.1.3
        //
        const split = moduleVersion.trim().split('@');
        if (split.length < 2) {
            return null;
        }
        // The version comes after the @ symbol:
        //
        //    v0.1.3
        //
        return split[1];
    });
}
function goProxyRequest(tool, endpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        const proxies = goProxy();
        // Try each URL set in the user's GOPROXY environment variable.
        // If none is set, don't make the request.
        for (const proxy of proxies) {
            if (proxy === 'direct') {
                continue;
            }
            const url = `${proxy}/${tool.importPath}/@v/${endpoint}`;
            let data;
            try {
                data = yield WebRequest.json(url, {
                    throwResponseError: true
                });
            }
            catch (e) {
                return null;
            }
            return data;
        }
        return null;
    });
}
function goProxy() {
    const output = process.env['GOPROXY'];
    if (!output || !output.trim()) {
        return [];
    }
    const split = output.trim().split(',');
    return split;
}
//# sourceMappingURL=goLanguageServer.js.map