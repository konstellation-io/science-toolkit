/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This file is loaded by both the extension and debug adapter, so it cannot import 'vscode'
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
let binPathCache = {};
exports.envPath = process.env['PATH'] || (process.platform === 'win32' ? process.env['Path'] : null);
function getBinPathFromEnvVar(toolName, envVarValue, appendBinToPath) {
    toolName = correctBinname(toolName);
    if (envVarValue) {
        const paths = envVarValue.split(path.delimiter);
        for (const p of paths) {
            const binpath = path.join(p, appendBinToPath ? 'bin' : '', toolName);
            if (executableFileExists(binpath)) {
                return binpath;
            }
        }
    }
    return null;
}
exports.getBinPathFromEnvVar = getBinPathFromEnvVar;
function getBinPathWithPreferredGopath(toolName, preferredGopaths, alternateTool) {
    if (binPathCache[toolName]) {
        return binPathCache[toolName];
    }
    if (alternateTool && path.isAbsolute(alternateTool) && executableFileExists(alternateTool)) {
        binPathCache[toolName] = alternateTool;
        return alternateTool;
    }
    const binname = alternateTool && !path.isAbsolute(alternateTool) ? alternateTool : toolName;
    const pathFromGoBin = getBinPathFromEnvVar(binname, process.env['GOBIN'], false);
    if (pathFromGoBin) {
        binPathCache[toolName] = pathFromGoBin;
        return pathFromGoBin;
    }
    for (const preferred of preferredGopaths) {
        if (typeof preferred === 'string') {
            // Search in the preferred GOPATH workspace's bin folder
            const pathFrompreferredGoPath = getBinPathFromEnvVar(binname, preferred, true);
            if (pathFrompreferredGoPath) {
                binPathCache[toolName] = pathFrompreferredGoPath;
                return pathFrompreferredGoPath;
            }
        }
    }
    // Check GOROOT (go, gofmt, godoc would be found here)
    const pathFromGoRoot = getBinPathFromEnvVar(binname, process.env['GOROOT'], true);
    if (pathFromGoRoot) {
        binPathCache[toolName] = pathFromGoRoot;
        return pathFromGoRoot;
    }
    // Finally search PATH parts
    const pathFromPath = getBinPathFromEnvVar(binname, exports.envPath, false);
    if (pathFromPath) {
        binPathCache[toolName] = pathFromPath;
        return pathFromPath;
    }
    // Check default path for go
    if (toolName === 'go') {
        const defaultPathForGo = process.platform === 'win32' ? 'C:\\Go\\bin\\go.exe' : '/usr/local/go/bin/go';
        if (executableFileExists(defaultPathForGo)) {
            binPathCache[toolName] = defaultPathForGo;
            return defaultPathForGo;
        }
        return;
    }
    // Else return the binary name directly (this will likely always fail downstream)
    return toolName;
}
exports.getBinPathWithPreferredGopath = getBinPathWithPreferredGopath;
function correctBinname(toolName) {
    if (process.platform === 'win32') {
        return toolName + '.exe';
    }
    return toolName;
}
function executableFileExists(filePath) {
    let exists = true;
    try {
        exists = fs.statSync(filePath).isFile();
        if (exists) {
            fs.accessSync(filePath, fs.constants.F_OK | fs.constants.X_OK);
        }
    }
    catch (e) {
        exists = false;
    }
    return exists;
}
function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch (e) {
        return false;
    }
}
exports.fileExists = fileExists;
function clearCacheForTools() {
    binPathCache = {};
}
exports.clearCacheForTools = clearCacheForTools;
/**
 * Exapnds ~ to homedir in non-Windows platform
 */
function resolveHomeDir(inputPath) {
    if (!inputPath || !inputPath.trim()) {
        return inputPath;
    }
    return inputPath.startsWith('~') ? path.join(os.homedir(), inputPath.substr(1)) : inputPath;
}
exports.resolveHomeDir = resolveHomeDir;
function stripBOM(s) {
    if (s && s[0] === '\uFEFF') {
        s = s.substr(1);
    }
    return s;
}
exports.stripBOM = stripBOM;
function parseEnvFile(envFilePath) {
    const env = {};
    if (!envFilePath) {
        return env;
    }
    try {
        const buffer = stripBOM(fs.readFileSync(envFilePath, 'utf8'));
        buffer.split('\n').forEach((line) => {
            const r = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
            if (r !== null) {
                let value = r[2] || '';
                if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                    value = value.replace(/\\n/gm, '\n');
                }
                env[r[1]] = value.replace(/(^['"]|['"]$)/g, '');
            }
        });
        return env;
    }
    catch (e) {
        throw new Error(`Cannot load environment variables from file ${envFilePath}`);
    }
}
exports.parseEnvFile = parseEnvFile;
// Walks up given folder path to return the closest ancestor that has `src` as a child
function getInferredGopath(folderPath) {
    if (!folderPath) {
        return;
    }
    const dirs = folderPath.toLowerCase().split(path.sep);
    // find src directory closest to given folder path
    const srcIdx = dirs.lastIndexOf('src');
    if (srcIdx > 0) {
        return folderPath.substr(0, dirs.slice(0, srcIdx).join(path.sep).length);
    }
}
exports.getInferredGopath = getInferredGopath;
/**
 * Returns the workspace in the given Gopath to which given directory path belongs to
 * @param gopath string Current Gopath. Can be ; or : separated (as per os) to support multiple paths
 * @param currentFileDirPath string
 */
function getCurrentGoWorkspaceFromGOPATH(gopath, currentFileDirPath) {
    if (!gopath) {
        return;
    }
    const workspaces = gopath.split(path.delimiter);
    let currentWorkspace = '';
    currentFileDirPath = fixDriveCasingInWindows(currentFileDirPath);
    // Find current workspace by checking if current file is
    // under any of the workspaces in $GOPATH
    for (const workspace of workspaces) {
        const possibleCurrentWorkspace = path.join(workspace, 'src');
        if (currentFileDirPath.startsWith(possibleCurrentWorkspace) ||
            (process.platform === 'win32' &&
                currentFileDirPath.toLowerCase().startsWith(possibleCurrentWorkspace.toLowerCase()))) {
            // In case of nested workspaces, (example: both /Users/me and /Users/me/src/a/b/c are in $GOPATH)
            // both parent & child workspace in the nested workspaces pair can make it inside the above if block
            // Therefore, the below check will take longer (more specific to current file) of the two
            if (possibleCurrentWorkspace.length > currentWorkspace.length) {
                currentWorkspace = currentFileDirPath.substr(0, possibleCurrentWorkspace.length);
            }
        }
    }
    return currentWorkspace;
}
exports.getCurrentGoWorkspaceFromGOPATH = getCurrentGoWorkspaceFromGOPATH;
// Workaround for issue in https://github.com/Microsoft/vscode/issues/9448#issuecomment-244804026
function fixDriveCasingInWindows(pathToFix) {
    return process.platform === 'win32' && pathToFix
        ? pathToFix.substr(0, 1).toUpperCase() + pathToFix.substr(1)
        : pathToFix;
}
exports.fixDriveCasingInWindows = fixDriveCasingInWindows;
/**
 * Returns the tool name from the given path to the tool
 * @param toolPath
 */
function getToolFromToolPath(toolPath) {
    if (!toolPath) {
        return;
    }
    let tool = path.basename(toolPath);
    if (process.platform === 'win32' && tool.endsWith('.exe')) {
        tool = tool.substr(0, tool.length - 4);
    }
    return tool;
}
exports.getToolFromToolPath = getToolFromToolPath;
//# sourceMappingURL=goPath.js.map