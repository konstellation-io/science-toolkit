"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
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
const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");
const vscode = require("vscode");
const diffUtils_1 = require("../../src/diffUtils");
const goCheck_1 = require("../../src/goCheck");
const goDeclaration_1 = require("../../src/goDeclaration");
const goExtraInfo_1 = require("../../src/goExtraInfo");
const goFillStruct_1 = require("../../src/goFillStruct");
const goGenerateTests_1 = require("../../src/goGenerateTests");
const goImport_1 = require("../../src/goImport");
const goOutline_1 = require("../../src/goOutline");
const goPackages_1 = require("../../src/goPackages");
const goPlayground_1 = require("../../src/goPlayground");
const goSignature_1 = require("../../src/goSignature");
const goSuggest_1 = require("../../src/goSuggest");
const goSymbol_1 = require("../../src/goSymbol");
const goTest_1 = require("../../src/goTest");
const util_1 = require("../../src/util");
const cp = require("child_process");
suite('Go Extension Tests', () => {
    const gopath = util_1.getCurrentGoPath();
    if (!gopath) {
        assert.ok(gopath, 'Cannot run tests if GOPATH is not set as environment variable');
        return;
    }
    const repoPath = path.join(gopath, 'src', 'test');
    const fixturePath = path.join(repoPath, 'testfixture');
    const fixtureSourcePath = path.join(__dirname, '..', '..', '..', 'test', 'fixtures');
    const generateTestsSourcePath = path.join(repoPath, 'generatetests');
    const generateFunctionTestSourcePath = path.join(repoPath, 'generatefunctiontest');
    const generatePackageTestSourcePath = path.join(repoPath, 'generatePackagetest');
    const testPath = path.join(__dirname, 'tests');
    const toolsGopath = util_1.getToolsGopath() || util_1.getCurrentGoPath();
    suiteSetup(() => {
        fs.removeSync(repoPath);
        fs.removeSync(testPath);
        fs.copySync(path.join(fixtureSourcePath, 'baseTest', 'test.go'), path.join(fixturePath, 'baseTest', 'test.go'));
        fs.copySync(path.join(fixtureSourcePath, 'baseTest', 'sample_test.go'), path.join(fixturePath, 'baseTest', 'sample_test.go'));
        fs.copySync(path.join(fixtureSourcePath, 'errorsTest', 'errors.go'), path.join(fixturePath, 'errorsTest', 'errors.go'));
        fs.copySync(path.join(fixtureSourcePath, 'gogetdocTestData', 'test.go'), path.join(fixturePath, 'gogetdocTestData', 'test.go'));
        fs.copySync(path.join(fixtureSourcePath, 'generatetests', 'generatetests.go'), path.join(generateTestsSourcePath, 'generatetests.go'));
        fs.copySync(path.join(fixtureSourcePath, 'generatetests', 'generatetests.go'), path.join(generateFunctionTestSourcePath, 'generatetests.go'));
        fs.copySync(path.join(fixtureSourcePath, 'generatetests', 'generatetests.go'), path.join(generatePackageTestSourcePath, 'generatetests.go'));
        fs.copySync(path.join(fixtureSourcePath, 'diffTestData', 'file1.go'), path.join(fixturePath, 'diffTest1Data', 'file1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'diffTestData', 'file2.go'), path.join(fixturePath, 'diffTest1Data', 'file2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'diffTestData', 'file1.go'), path.join(fixturePath, 'diffTest2Data', 'file1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'diffTestData', 'file2.go'), path.join(fixturePath, 'diffTest2Data', 'file2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'linterTest', 'linter_1.go'), path.join(fixturePath, 'linterTest', 'linter_1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'linterTest', 'linter_2.go'), path.join(fixturePath, 'linterTest', 'linter_2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'errorsTest', 'errors.go'), path.join(testPath, 'errorsTest', 'errors.go'));
        fs.copySync(path.join(fixtureSourcePath, 'linterTest', 'linter_1.go'), path.join(testPath, 'linterTest', 'linter_1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'linterTest', 'linter_2.go'), path.join(testPath, 'linterTest', 'linter_2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'buildTags', 'hello.go'), path.join(fixturePath, 'buildTags', 'hello.go'));
        fs.copySync(path.join(fixtureSourcePath, 'testTags', 'hello_test.go'), path.join(fixturePath, 'testTags', 'hello_test.go'));
        fs.copySync(path.join(fixtureSourcePath, 'completions', 'unimportedPkgs.go'), path.join(fixturePath, 'completions', 'unimportedPkgs.go'));
        fs.copySync(path.join(fixtureSourcePath, 'completions', 'unimportedMultiplePkgs.go'), path.join(fixturePath, 'completions', 'unimportedMultiplePkgs.go'));
        fs.copySync(path.join(fixtureSourcePath, 'completions', 'snippets.go'), path.join(fixturePath, 'completions', 'snippets.go'));
        fs.copySync(path.join(fixtureSourcePath, 'completions', 'nosnippets.go'), path.join(fixturePath, 'completions', 'nosnippets.go'));
        fs.copySync(path.join(fixtureSourcePath, 'completions', 'exportedMemberDocs.go'), path.join(fixturePath, 'completions', 'exportedMemberDocs.go'));
        fs.copySync(path.join(fixtureSourcePath, 'importTest', 'noimports.go'), path.join(fixturePath, 'importTest', 'noimports.go'));
        fs.copySync(path.join(fixtureSourcePath, 'importTest', 'groupImports.go'), path.join(fixturePath, 'importTest', 'groupImports.go'));
        fs.copySync(path.join(fixtureSourcePath, 'importTest', 'singleImports.go'), path.join(fixturePath, 'importTest', 'singleImports.go'));
        fs.copySync(path.join(fixtureSourcePath, 'fillStruct', 'input_1.go'), path.join(fixturePath, 'fillStruct', 'input_1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'fillStruct', 'golden_1.go'), path.join(fixturePath, 'fillStruct', 'golden_1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'fillStruct', 'input_2.go'), path.join(fixturePath, 'fillStruct', 'input_2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'fillStruct', 'golden_2.go'), path.join(fixturePath, 'fillStruct', 'golden_2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'fillStruct', 'input_2.go'), path.join(fixturePath, 'fillStruct', 'input_3.go'));
        fs.copySync(path.join(fixtureSourcePath, 'outlineTest', 'test.go'), path.join(fixturePath, 'outlineTest', 'test.go'));
    });
    suiteTeardown(() => {
        fs.removeSync(repoPath);
        fs.removeSync(testPath);
    });
    function testDefinitionProvider(goConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = new goDeclaration_1.GoDefinitionProvider(goConfig);
            const uri = vscode.Uri.file(path.join(fixturePath, 'baseTest', 'test.go'));
            const position = new vscode.Position(10, 3);
            try {
                const textDocument = yield vscode.workspace.openTextDocument(uri);
                const definitionInfo = yield provider.provideDefinition(textDocument, position, null);
                assert.equal(definitionInfo.uri.path.toLowerCase(), uri.path.toLowerCase(), `${definitionInfo.uri.path} is not the same as ${uri.path}`);
                assert.equal(definitionInfo.range.start.line, 6);
                assert.equal(definitionInfo.range.start.character, 5);
            }
            catch (err) {
                assert.ok(false, `error in OpenTextDocument ${err}`);
                return Promise.reject(err);
            }
        });
    }
    function testSignatureHelpProvider(goConfig, testCases) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = new goSignature_1.GoSignatureHelpProvider(goConfig);
            const uri = vscode.Uri.file(path.join(fixturePath, 'gogetdocTestData', 'test.go'));
            try {
                const textDocument = yield vscode.workspace.openTextDocument(uri);
                const promises = testCases.map(([position, expected, expectedDoc, expectedParams]) => provider.provideSignatureHelp(textDocument, position, null).then(sigHelp => {
                    assert.ok(sigHelp, `No signature for gogetdocTestData/test.go:${position.line + 1}:${position.character + 1}`);
                    assert.equal(sigHelp.signatures.length, 1, 'unexpected number of overloads');
                    assert.equal(sigHelp.signatures[0].label, expected);
                    assert.equal(sigHelp.signatures[0].documentation, expectedDoc);
                    assert.equal(sigHelp.signatures[0].parameters.length, expectedParams.length);
                    for (let i = 0; i < expectedParams.length; i++) {
                        assert.equal(sigHelp.signatures[0].parameters[i].label, expectedParams[i]);
                    }
                }));
                return Promise.all(promises);
            }
            catch (err) {
                assert.ok(false, `error in OpenTextDocument ${err}`);
                return Promise.reject(err);
            }
        });
    }
    function testHoverProvider(goConfig, testCases) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = new goExtraInfo_1.GoHoverProvider(goConfig);
            const uri = vscode.Uri.file(path.join(fixturePath, 'gogetdocTestData', 'test.go'));
            try {
                const textDocument = yield vscode.workspace.openTextDocument(uri);
                const promises = testCases.map(([position, expectedSignature, expectedDocumentation]) => provider.provideHover(textDocument, position, null).then(res => {
                    if (expectedSignature === null && expectedDocumentation === null) {
                        assert.equal(res, null);
                        return;
                    }
                    let expectedHover = '\n```go\n' + expectedSignature + '\n```\n';
                    if (expectedDocumentation != null) {
                        expectedHover += expectedDocumentation;
                    }
                    assert.equal(res.contents.length, 1);
                    assert.equal(res.contents[0].value, expectedHover);
                }));
                return Promise.all(promises);
            }
            catch (err) {
                assert.ok(false, `error in OpenTextDocument ${err}`);
                return Promise.reject(err);
            }
        });
    }
    test('Test Definition Provider using godoc', (done) => {
        const config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'godoc' }
        });
        testDefinitionProvider(config).then(() => done(), done);
    });
    test('Test Definition Provider using gogetdoc', (done) => {
        const gogetdocPath = util_1.getBinPath('gogetdoc');
        if (gogetdocPath === 'gogetdoc') {
            return done();
        }
        const config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'gogetdoc' }
        });
        testDefinitionProvider(config).then(() => done(), done);
    }).timeout(10000);
    test('Test SignatureHelp Provider using godoc', (done) => {
        const printlnDoc = `Println formats using the default formats for its operands and writes to
standard output. Spaces are always added between operands and a newline is
appended. It returns the number of bytes written and any write error
encountered.
`;
        const testCases = [
            [new vscode.Position(19, 13), 'Println(a ...interface{}) (n int, err error)', printlnDoc, ['a ...interface{}']],
            [new vscode.Position(23, 7), 'print(txt string)', 'This is an unexported function so couldn\'t get this comment on hover :( Not\nanymore!!\n', ['txt string']],
            [new vscode.Position(41, 19), 'Hello(s string, exclaim bool) string', 'Hello is a method on the struct ABC. Will signature help understand this\ncorrectly\n', ['s string', 'exclaim bool']],
            [new vscode.Position(41, 47), 'EmptyLine(s string) string', 'EmptyLine has docs\n\nwith a blank line in the middle\n', ['s string']]
        ];
        const config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'godoc' }
        });
        testSignatureHelpProvider(config, testCases).then(() => done(), done);
    });
    test('Test SignatureHelp Provider using gogetdoc', (done) => {
        const gogetdocPath = util_1.getBinPath('gogetdoc');
        if (gogetdocPath === 'gogetdoc') {
            return done();
        }
        const printlnDoc = `Println formats using the default formats for its operands and writes to standard output.
Spaces are always added between operands and a newline is appended.
It returns the number of bytes written and any write error encountered.
`;
        const testCases = [
            [new vscode.Position(19, 13), 'Println(a ...interface{}) (n int, err error)', printlnDoc, ['a ...interface{}']],
            [new vscode.Position(23, 7), 'print(txt string)', 'This is an unexported function so couldn\'t get this comment on hover :(\nNot anymore!!\n', ['txt string']],
            [new vscode.Position(41, 19), 'Hello(s string, exclaim bool) string', 'Hello is a method on the struct ABC. Will signature help understand this correctly\n', ['s string', 'exclaim bool']],
            [new vscode.Position(41, 47), 'EmptyLine(s string) string', 'EmptyLine has docs\n\nwith a blank line in the middle\n', ['s string']]
        ];
        const config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'gogetdoc' }
        });
        testSignatureHelpProvider(config, testCases).then(() => done(), done);
    }).timeout(10000);
    test('Test Hover Provider using godoc', (done) => {
        const printlnDoc = `Println formats using the default formats for its operands and writes to
standard output. Spaces are always added between operands and a newline is
appended. It returns the number of bytes written and any write error
encountered.
`;
        const testCases = [
            // [new vscode.Position(3,3), '/usr/local/go/src/fmt'],
            [new vscode.Position(0, 3), null, null],
            [new vscode.Position(23, 14), null, null],
            [new vscode.Position(20, 0), null, null],
            [new vscode.Position(28, 16), null, null],
            [new vscode.Position(22, 5), 'main func()', '\n'],
            [new vscode.Position(40, 23), 'import (math "math")', null],
            [new vscode.Position(19, 6), 'Println func(a ...interface{}) (n int, err error)', printlnDoc],
            [new vscode.Position(23, 4), 'print func(txt string)', 'This is an unexported function so couldn\'t get this comment on hover :( Not\nanymore!!\n']
        ];
        const config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'godoc' }
        });
        testHoverProvider(config, testCases).then(() => done(), done);
    }).timeout(10000);
    test('Test Hover Provider using gogetdoc', (done) => {
        const gogetdocPath = util_1.getBinPath('gogetdoc');
        if (gogetdocPath === 'gogetdoc') {
            return done();
        }
        const printlnDoc = `Println formats using the default formats for its operands and writes to standard output.
Spaces are always added between operands and a newline is appended.
It returns the number of bytes written and any write error encountered.
`;
        const testCases = [
            [new vscode.Position(0, 3), null, null],
            [new vscode.Position(23, 11), null, null],
            [new vscode.Position(20, 0), null, null],
            [new vscode.Position(28, 16), null, null],
            [new vscode.Position(22, 5), 'func main()', ''],
            [new vscode.Position(23, 4), 'func print(txt string)', 'This is an unexported function so couldn\'t get this comment on hover :(\nNot anymore!!\n'],
            [new vscode.Position(40, 23), 'package math', 'Package math provides basic constants and mathematical functions.\n\nThis package does not guarantee bit-identical results across architectures.\n'],
            [new vscode.Position(19, 6), 'func Println(a ...interface{}) (n int, err error)', printlnDoc],
            [new vscode.Position(27, 14), 'type ABC struct {\n    a int\n    b int\n    c int\n}', 'ABC is a struct, you coudn\'t use Goto Definition or Hover info on this before\nNow you can due to gogetdoc and go doc\n'],
            [new vscode.Position(28, 6), 'func IPv4Mask(a, b, c, d byte) IPMask', 'IPv4Mask returns the IP mask (in 4-byte form) of the\nIPv4 mask a.b.c.d.\n']
        ];
        const config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'gogetdoc' }
        });
        testHoverProvider(config, testCases).then(() => done(), done);
    }).timeout(10000);
    test('Error checking', (done) => {
        const config = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'package' },
            'vetFlags': { value: ['-all'] },
            'lintOnSave': { value: 'package' },
            'lintTool': { value: 'golint' },
            'lintFlags': { value: [] },
            'buildOnSave': { value: 'package' },
        });
        const expected = [
            { line: 7, severity: 'warning', msg: 'exported function Print2 should have comment or be unexported' },
            { line: 11, severity: 'error', msg: 'undefined: prin' },
        ];
        util_1.getGoVersion().then((version) => __awaiter(void 0, void 0, void 0, function* () {
            const diagnostics = yield goCheck_1.check(vscode.Uri.file(path.join(fixturePath, 'errorsTest', 'errors.go')), config);
            const sortedDiagnostics = []
                .concat.apply([], diagnostics.map(x => x.errors))
                .sort((a, b) => a.line - b.line);
            assert.equal(sortedDiagnostics.length > 0, true, `Failed to get linter results`);
            const matchCount = expected.filter(expectedItem => {
                return sortedDiagnostics.some((diag) => {
                    return expectedItem.line === diag.line
                        && expectedItem.severity === diag.severity
                        && expectedItem.msg === diag.msg;
                });
            });
            assert.equal(matchCount.length >= expected.length, true, `Failed to match expected errors`);
        })).then(() => done(), done);
    }).timeout(10000);
    test('Test Generate unit tests skeleton for file', (done) => {
        const gotestsPath = util_1.getBinPath('gotests');
        if (gotestsPath === 'gotests') {
            return done();
        }
        util_1.getGoVersion().then((version) => __awaiter(void 0, void 0, void 0, function* () {
            const uri = vscode.Uri.file(path.join(generateTestsSourcePath, 'generatetests.go'));
            const document = yield vscode.workspace.openTextDocument(uri);
            const editor = yield vscode.window.showTextDocument(document);
            const result = yield goGenerateTests_1.generateTestCurrentFile();
            assert.equal(result, true);
            yield Promise.resolve();
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            if (fs.existsSync(path.join(generateTestsSourcePath, 'generatetests_test.go'))) {
                return Promise.resolve();
            }
            else {
                return Promise.reject('generatetests_test.go not found');
            }
        })).then(() => done(), done);
    });
    test('Test Generate unit tests skeleton for a function', (done) => {
        const gotestsPath = util_1.getBinPath('gotests');
        if (gotestsPath === 'gotests') {
            return done();
        }
        util_1.getGoVersion().then((version) => __awaiter(void 0, void 0, void 0, function* () {
            const uri = vscode.Uri.file(path.join(generateFunctionTestSourcePath, 'generatetests.go'));
            const document = yield vscode.workspace.openTextDocument(uri);
            const editor = yield vscode.window.showTextDocument(document);
            assert(vscode.window.activeTextEditor, 'No active editor');
            const selection = new vscode.Selection(5, 0, 6, 0);
            editor.selection = selection;
            const result = yield goGenerateTests_1.generateTestCurrentFunction();
            assert.equal(result, true);
            yield Promise.resolve();
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            if (fs.existsSync(path.join(generateTestsSourcePath, 'generatetests_test.go'))) {
                return Promise.resolve();
            }
            else {
                return Promise.reject('generatetests_test.go not found');
            }
        })).then(() => done(), done);
    });
    test('Test Generate unit tests skeleton for package', (done) => {
        const gotestsPath = util_1.getBinPath('gotests');
        if (gotestsPath === 'gotests') {
            return done();
        }
        util_1.getGoVersion().then((version) => __awaiter(void 0, void 0, void 0, function* () {
            const uri = vscode.Uri.file(path.join(generatePackageTestSourcePath, 'generatetests.go'));
            const document = yield vscode.workspace.openTextDocument(uri);
            const editor = yield vscode.window.showTextDocument(document);
            const result = yield goGenerateTests_1.generateTestCurrentPackage();
            assert.equal(result, true);
            yield Promise.resolve();
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            if (fs.existsSync(path.join(generateTestsSourcePath, 'generatetests_test.go'))) {
                return Promise.resolve();
            }
            else {
                return Promise.reject('generatetests_test.go not found');
            }
        })).then(() => done(), done);
    });
    test('Test diffUtils.getEditsFromUnifiedDiffStr', (done) => {
        const file1path = path.join(fixturePath, 'diffTest1Data', 'file1.go');
        const file2path = path.join(fixturePath, 'diffTest1Data', 'file2.go');
        const file1uri = vscode.Uri.file(file1path);
        const file2contents = fs.readFileSync(file2path, 'utf8');
        const diffPromise = new Promise((resolve, reject) => {
            cp.exec(`diff -u ${file1path} ${file2path}`, (err, stdout, stderr) => {
                const filePatches = diffUtils_1.getEditsFromUnifiedDiffStr(stdout);
                if (!filePatches && filePatches.length !== 1) {
                    assert.fail(null, null, 'Failed to get patches for the test file', '');
                    return reject();
                }
                if (!filePatches[0].fileName) {
                    assert.fail(null, null, 'Failed to parse the file path from the diff output', '');
                    return reject();
                }
                if (!filePatches[0].edits) {
                    assert.fail(null, null, 'Failed to parse edits from the diff output', '');
                    return reject();
                }
                resolve(filePatches);
            });
        });
        diffPromise.then((filePatches) => __awaiter(void 0, void 0, void 0, function* () {
            const textDocument = yield vscode.workspace.openTextDocument(file1uri);
            const editor = yield vscode.window.showTextDocument(textDocument);
            yield editor.edit((editBuilder) => {
                filePatches[0].edits.forEach((edit) => {
                    edit.applyUsingTextEditorEdit(editBuilder);
                });
            });
            assert.equal(editor.document.getText(), file2contents);
            return Promise.resolve();
        })).then(() => done(), done);
    });
    test('Test diffUtils.getEdits', (done) => {
        const file1path = path.join(fixturePath, 'diffTest2Data', 'file1.go');
        const file2path = path.join(fixturePath, 'diffTest2Data', 'file2.go');
        const file1uri = vscode.Uri.file(file1path);
        const file1contents = fs.readFileSync(file1path, 'utf8');
        const file2contents = fs.readFileSync(file2path, 'utf8');
        const fileEdits = diffUtils_1.getEdits(file1path, file1contents, file2contents);
        if (!fileEdits) {
            assert.fail(null, null, 'Failed to get patches for the test file', '');
            done();
            return;
        }
        if (!fileEdits.fileName) {
            assert.fail(null, null, 'Failed to parse the file path from the diff output', '');
            done();
            return;
        }
        if (!fileEdits.edits) {
            assert.fail(null, null, 'Failed to parse edits from the diff output', '');
            done();
            return;
        }
        vscode.workspace.openTextDocument(file1uri).then((textDocument) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const editor = yield vscode.window.showTextDocument(textDocument);
                yield editor.edit((editBuilder) => {
                    fileEdits.edits.forEach(edit => {
                        edit.applyUsingTextEditorEdit(editBuilder);
                    });
                });
                assert.equal(editor.document.getText(), file2contents);
                yield Promise.resolve();
                return done();
            }
            catch (err) {
                return done(err);
            }
        }));
    });
    test('Test Env Variables are passed to Tests', (done) => {
        const config = Object.create(vscode.workspace.getConfiguration('go'), {
            'testEnvVars': { value: { 'dummyEnvVar': 'dummyEnvValue', 'dummyNonString': 1 } }
        });
        const uri = vscode.Uri.file(path.join(fixturePath, 'baseTest', 'sample_test.go'));
        vscode.workspace.openTextDocument(uri).then((document) => __awaiter(void 0, void 0, void 0, function* () {
            const editor = yield vscode.window.showTextDocument(document);
            const result = yield goTest_1.testCurrentFile(config, false, []);
            assert.equal(result, true);
            return Promise.resolve();
        })).then(() => done(), done);
    }).timeout(10000);
    test('Test Outline', (done) => {
        const uri = vscode.Uri.file(path.join(fixturePath, 'outlineTest', 'test.go'));
        vscode.workspace.openTextDocument(uri).then(document => {
            const options = { document, fileName: document.fileName, importsOption: goOutline_1.GoOutlineImportsOptions.Include };
            goOutline_1.documentSymbols(options, null).then(outlines => {
                const packageSymbols = outlines.filter((x) => x.kind === vscode.SymbolKind.Package);
                const imports = outlines[0].children.filter((x) => x.kind === vscode.SymbolKind.Namespace);
                const functions = outlines[0].children.filter((x) => x.kind === vscode.SymbolKind.Function);
                assert.equal(packageSymbols.length, 1);
                assert.equal(packageSymbols[0].name, 'main');
                assert.equal(imports.length, 1);
                assert.equal(imports[0].name, '"fmt"');
                assert.equal(functions.length, 2);
                assert.equal(functions[0].name, 'print');
                assert.equal(functions[1].name, 'main');
                done();
            }, done);
        });
    });
    test('Test Outline imports only', (done) => {
        const uri = vscode.Uri.file(path.join(fixturePath, 'outlineTest', 'test.go'));
        vscode.workspace.openTextDocument(uri).then(document => {
            const options = { document, fileName: document.fileName, importsOption: goOutline_1.GoOutlineImportsOptions.Only };
            goOutline_1.documentSymbols(options, null).then(outlines => {
                const packageSymbols = outlines.filter(x => x.kind === vscode.SymbolKind.Package);
                const imports = outlines[0].children.filter((x) => x.kind === vscode.SymbolKind.Namespace);
                const functions = outlines[0].children.filter((x) => x.kind === vscode.SymbolKind.Function);
                assert.equal(packageSymbols.length, 1);
                assert.equal(packageSymbols[0].name, 'main');
                assert.equal(imports.length, 1);
                assert.equal(imports[0].name, '"fmt"');
                assert.equal(functions.length, 0);
                done();
            }, done);
        });
    });
    test('Test Outline document symbols', (done) => {
        const uri = vscode.Uri.file(path.join(fixturePath, 'outlineTest', 'test.go'));
        vscode.workspace.openTextDocument(uri).then(document => {
            new goOutline_1.GoDocumentSymbolProvider().provideDocumentSymbols(document, null).then(outlines => {
                const packages = outlines.filter(x => x.kind === vscode.SymbolKind.Package);
                const variables = outlines[0].children.filter((x) => x.kind === vscode.SymbolKind.Variable);
                const functions = outlines[0].children.filter((x) => x.kind === vscode.SymbolKind.Function);
                const structs = outlines[0].children.filter((x) => x.kind === vscode.SymbolKind.Struct);
                assert.equal(packages[0].name, 'main');
                assert.equal(variables.length, 0);
                assert.equal(functions[0].name, 'print');
                assert.equal(functions[1].name, 'main');
                assert.equal(structs.length, 1);
                assert.equal(structs[0].name, 'foo');
            });
        }).then(() => done(), done);
    });
    test('Test listPackages', (done) => {
        const uri = vscode.Uri.file(path.join(fixturePath, 'baseTest', 'test.go'));
        vscode.workspace.openTextDocument(uri).then(document => vscode.window.showTextDocument(document)
            .then((editor) => __awaiter(void 0, void 0, void 0, function* () {
            const includeImportedPkgs = yield goImport_1.listPackages(false);
            const excludeImportedPkgs = yield goImport_1.listPackages(true);
            assert.equal(includeImportedPkgs.indexOf('fmt') > -1, true);
            assert.equal(excludeImportedPkgs.indexOf('fmt') > -1, false);
        }))).then(() => done(), done);
    });
    test('Replace vendor packages with relative path', (done) => {
        // This test needs a go project that has vendor folder and vendor packages
        // Since the Go extension takes a dependency on the godef tool at github.com/rogpeppe/godef
        // which has vendor packages, we are using it here to test the "replace vendor packages with relative path" feature.
        // If the extension ever stops depending on godef tool or if godef ever stops having vendor packages, then this test
        // will fail and will have to be replaced with any other go project with vendor packages
        const vendorSupportPromise = util_1.isVendorSupported();
        const filePath = path.join(toolsGopath, 'src', 'github.com', 'rogpeppe', 'godef', 'go', 'ast', 'ast.go');
        const workDir = path.dirname(filePath);
        const vendorPkgsFullPath = [
            'github.com/rogpeppe/godef/vendor/9fans.net/go/acme',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9/client'
        ];
        const vendorPkgsRelativePath = [
            '9fans.net/go/acme',
            '9fans.net/go/plan9',
            '9fans.net/go/plan9/client'
        ];
        vendorSupportPromise.then((vendorSupport) => __awaiter(void 0, void 0, void 0, function* () {
            const gopkgsPromise = goPackages_1.getAllPackages(workDir).then(pkgMap => {
                const pkgs = Array.from(pkgMap.keys()).filter(p => pkgMap.get(p).name !== 'main');
                if (vendorSupport) {
                    vendorPkgsFullPath.forEach(pkg => {
                        assert.equal(pkgs.indexOf(pkg) > -1, true, `Package not found by goPkgs: ${pkg}`);
                    });
                    vendorPkgsRelativePath.forEach(pkg => {
                        assert.equal(pkgs.indexOf(pkg), -1, `Relative path to vendor package ${pkg} should not be returned by gopkgs command`);
                    });
                }
                return Promise.resolve(pkgs);
            });
            const listPkgPromise = vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then((document) => __awaiter(void 0, void 0, void 0, function* () {
                const editor = yield vscode.window.showTextDocument(document);
                const pkgs = yield goImport_1.listPackages();
                if (vendorSupport) {
                    vendorPkgsRelativePath.forEach(pkg => {
                        assert.equal(pkgs.indexOf(pkg) > -1, true, `Relative path for vendor package ${pkg} not found`);
                    });
                    vendorPkgsFullPath.forEach(pkg => {
                        assert.equal(pkgs.indexOf(pkg), -1, `Full path for vendor package ${pkg} should be shown by listPackages method`);
                    });
                }
                return Promise.resolve(pkgs);
            }));
            const values = yield Promise.all([gopkgsPromise, listPkgPromise]);
            if (!vendorSupport) {
                const originalPkgs = values[0].sort();
                const updatedPkgs = values[1].sort();
                assert.equal(originalPkgs.length, updatedPkgs.length);
                for (let index = 0; index < originalPkgs.length; index++) {
                    assert.equal(updatedPkgs[index], originalPkgs[index]);
                }
            }
        })).then(() => done(), done);
    });
    test('Vendor pkgs from other projects should not be allowed to import', (done) => {
        // This test needs a go project that has vendor folder and vendor packages
        // Since the Go extension takes a dependency on the godef tool at github.com/rogpeppe/godef
        // which has vendor packages, we are using it here to test the "replace vendor packages with relative path" feature.
        // If the extension ever stops depending on godef tool or if godef ever stops having vendor packages, then this test
        // will fail and will have to be replaced with any other go project with vendor packages
        const vendorSupportPromise = util_1.isVendorSupported();
        const filePath = path.join(toolsGopath, 'src', 'github.com', 'ramya-rao-a', 'go-outline', 'main.go');
        const vendorPkgs = [
            'github.com/rogpeppe/godef/vendor/9fans.net/go/acme',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9/client'
        ];
        vendorSupportPromise.then((vendorSupport) => {
            const gopkgsPromise = new Promise((resolve, reject) => {
                const cmd = cp.spawn(util_1.getBinPath('gopkgs'), ['-format', '{{.ImportPath}}'], { env: process.env });
                const chunks = [];
                cmd.stdout.on('data', (d) => chunks.push(d));
                cmd.on('close', () => {
                    const pkgs = chunks.join('').split('\n').filter((pkg) => pkg).sort();
                    if (vendorSupport) {
                        vendorPkgs.forEach(pkg => {
                            assert.equal(pkgs.indexOf(pkg) > -1, true, `Package not found by goPkgs: ${pkg}`);
                        });
                    }
                    return resolve();
                });
            });
            const listPkgPromise = vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then((document) => __awaiter(void 0, void 0, void 0, function* () {
                const editor = yield vscode.window.showTextDocument(document);
                const pkgs = yield goImport_1.listPackages();
                if (vendorSupport) {
                    vendorPkgs.forEach(pkg => {
                        assert.equal(pkgs.indexOf(pkg), -1, `Vendor package ${pkg} should not be shown by listPackages method`);
                    });
                }
                return Promise.resolve();
            }));
            return Promise.all([gopkgsPromise, listPkgPromise]);
        }).then(() => done(), done);
    });
    test('Workspace Symbols', () => {
        // This test needs a go project that has vendor folder and vendor packages
        // Since the Go extension takes a dependency on the godef tool at github.com/rogpeppe/godef
        // which has vendor packages, we are using it here to test the "replace vendor packages with relative path" feature.
        // If the extension ever stops depending on godef tool or if godef ever stops having vendor packages, then this test
        // will fail and will have to be replaced with any other go project with vendor packages
        const workspacePath = path.join(toolsGopath, 'src', 'github.com', 'rogpeppe', 'godef');
        const configWithoutIgnoringFolders = Object.create(vscode.workspace.getConfiguration('go'), {
            'gotoSymbol': {
                value: {
                    'ignoreFolders': []
                }
            }
        });
        const configWithIgnoringFolders = Object.create(vscode.workspace.getConfiguration('go'), {
            'gotoSymbol': {
                value: {
                    'ignoreFolders': ['vendor']
                }
            }
        });
        const configWithIncludeGoroot = Object.create(vscode.workspace.getConfiguration('go'), {
            'gotoSymbol': {
                value: {
                    'includeGoroot': true
                }
            }
        });
        const configWithoutIncludeGoroot = Object.create(vscode.workspace.getConfiguration('go'), {
            'gotoSymbol': {
                value: {
                    'includeGoroot': false
                }
            }
        });
        const withoutIgnoringFolders = goSymbol_1.getWorkspaceSymbols(workspacePath, 'WinInfo', null, configWithoutIgnoringFolders).then(results => {
            assert.equal(results[0].name, 'WinInfo');
            assert.equal(results[0].path, path.join(workspacePath, 'vendor/9fans.net/go/acme/acme.go'));
        });
        const withIgnoringFolders = goSymbol_1.getWorkspaceSymbols(workspacePath, 'WinInfo', null, configWithIgnoringFolders).then(results => {
            assert.equal(results.length, 0);
        });
        const withoutIncludingGoroot = goSymbol_1.getWorkspaceSymbols(workspacePath, 'Mutex', null, configWithoutIncludeGoroot).then(results => {
            assert.equal(results.length, 0);
        });
        const withIncludingGoroot = goSymbol_1.getWorkspaceSymbols(workspacePath, 'Mutex', null, configWithIncludeGoroot).then(results => {
            assert(results.some(result => result.name === 'Mutex'));
        });
        return Promise.all([withIgnoringFolders, withoutIgnoringFolders, withIncludingGoroot, withoutIncludingGoroot]);
    }).timeout(10000);
    test('Test Completion', (done) => {
        const printlnDoc = `Println formats using the default formats for its operands and writes to
standard output. Spaces are always added between operands and a newline is
appended. It returns the number of bytes written and any write error
encountered.
`;
        const provider = new goSuggest_1.GoCompletionItemProvider();
        const testCases = [
            [new vscode.Position(7, 4), 'fmt', 'fmt', null],
            [new vscode.Position(7, 6), 'Println', 'func(a ...interface{}) (n int, err error)', printlnDoc]
        ];
        const uri = vscode.Uri.file(path.join(fixturePath, 'baseTest', 'test.go'));
        vscode.workspace.openTextDocument(uri).then((textDocument) => __awaiter(void 0, void 0, void 0, function* () {
            const editor = yield vscode.window.showTextDocument(textDocument);
            const promises = testCases.map(([position, expectedLabel, expectedDetail, expectedDoc]) => provider.provideCompletionItems(editor.document, position, null).then((items) => __awaiter(void 0, void 0, void 0, function* () {
                const item = items.items.find(x => x.label === expectedLabel);
                assert.equal(!!item, true, 'missing expected item in completion list');
                assert.equal(item.detail, expectedDetail);
                const resolvedItemResult = provider.resolveCompletionItem(item, null);
                if (!resolvedItemResult) {
                    return;
                }
                if (resolvedItemResult instanceof vscode.CompletionItem) {
                    if (resolvedItemResult.documentation) {
                        assert.equal(resolvedItemResult.documentation.value, expectedDoc);
                    }
                    return;
                }
                const resolvedItem = yield resolvedItemResult;
                if (resolvedItem) {
                    assert.equal(resolvedItem.documentation.value, expectedDoc);
                }
            })));
            yield Promise.all(promises);
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            return Promise.resolve();
        }), (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    });
    test('Test Completion Snippets For Functions', (done) => {
        const provider = new goSuggest_1.GoCompletionItemProvider();
        const uri = vscode.Uri.file(path.join(fixturePath, 'completions', 'snippets.go'));
        const testCases = [
            [new vscode.Position(5, 6), ['Print']]
        ];
        const baseConfig = vscode.workspace.getConfiguration('go');
        vscode.workspace.openTextDocument(uri).then((textDocument) => __awaiter(void 0, void 0, void 0, function* () {
            const editor = yield vscode.window.showTextDocument(textDocument);
            const noFunctionSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(9, 6), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: false } })).then(items => {
                items = items instanceof vscode.CompletionList ? items.items : items;
                const item = items.find(x => x.label === 'Print');
                assert.equal(!item.insertText, true);
            });
            const withFunctionSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(9, 6), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items1 => {
                items1 = items1 instanceof vscode.CompletionList ? items1.items : items1;
                const item1 = items1.find(x => x.label === 'Print');
                assert.equal(item1.insertText.value, 'Print(${1:a ...interface{\\}})');
            });
            const withFunctionSnippetNotype = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(9, 6), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggestWithoutType': { value: true } })).then(items2 => {
                items2 = items2 instanceof vscode.CompletionList ? items2.items : items2;
                const item2 = items2.find(x => x.label === 'Print');
                assert.equal(item2.insertText.value, 'Print(${1:a})');
            });
            const noFunctionAsVarSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(11, 3), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: false } })).then(items3 => {
                items3 = items3 instanceof vscode.CompletionList ? items3.items : items3;
                const item3 = items3.find(x => x.label === 'funcAsVariable');
                assert.equal(!item3.insertText, true);
            });
            const withFunctionAsVarSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(11, 3), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items4 => {
                items4 = items4 instanceof vscode.CompletionList ? items4.items : items4;
                const item4 = items4.find(x => x.label === 'funcAsVariable');
                assert.equal(item4.insertText.value, 'funcAsVariable(${1:k string})');
            });
            const withFunctionAsVarSnippetNoType = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(11, 3), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggestWithoutType': { value: true } })).then(items5 => {
                items5 = items5 instanceof vscode.CompletionList ? items5.items : items5;
                const item5 = items5.find(x => x.label === 'funcAsVariable');
                assert.equal(item5.insertText.value, 'funcAsVariable(${1:k})');
            });
            const noFunctionAsTypeSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(14, 0), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: false } })).then(items6 => {
                items6 = items6 instanceof vscode.CompletionList ? items6.items : items6;
                const item1 = items6.find(x => x.label === 'HandlerFunc');
                const item2 = items6.find(x => x.label === 'HandlerFuncWithArgNames');
                const item3 = items6.find(x => x.label === 'HandlerFuncNoReturnType');
                assert.equal(!item1.insertText, true);
                assert.equal(!item2.insertText, true);
                assert.equal(!item3.insertText, true);
            });
            const withFunctionAsTypeSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(14, 0), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items7 => {
                items7 = items7 instanceof vscode.CompletionList ? items7.items : items7;
                const item11 = items7.find(x => x.label === 'HandlerFunc');
                const item21 = items7.find(x => x.label === 'HandlerFuncWithArgNames');
                const item31 = items7.find(x => x.label === 'HandlerFuncNoReturnType');
                assert.equal(item11.insertText.value, 'HandlerFunc(func(${1:arg1} string, ${2:arg2} string) {\n\t$3\n}) (string, string)');
                assert.equal(item21.insertText.value, 'HandlerFuncWithArgNames(func(${1:w} string, ${2:r} string) {\n\t$3\n}) int');
                assert.equal(item31.insertText.value, 'HandlerFuncNoReturnType(func(${1:arg1} string, ${2:arg2} string) {\n\t$3\n})');
            });
            yield Promise.all([
                noFunctionSnippet,
                withFunctionSnippet,
                withFunctionSnippetNotype,
                noFunctionAsVarSnippet,
                withFunctionAsVarSnippet,
                withFunctionAsVarSnippetNoType,
                noFunctionAsTypeSnippet,
                withFunctionAsTypeSnippet
            ]);
            return yield vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }), (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    }).timeout(10000);
    test('Test No Completion Snippets For Functions', (done) => {
        const provider = new goSuggest_1.GoCompletionItemProvider();
        const uri = vscode.Uri.file(path.join(fixturePath, 'completions', 'nosnippets.go'));
        const baseConfig = vscode.workspace.getConfiguration('go');
        vscode.workspace.openTextDocument(uri).then((textDocument) => __awaiter(void 0, void 0, void 0, function* () {
            const editor = yield vscode.window.showTextDocument(textDocument);
            const symbolFollowedByBrackets = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(5, 10), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items => {
                items = items instanceof vscode.CompletionList ? items.items : items;
                const item = items.find(x => x.label === 'Print');
                assert.equal(!item.insertText, true, 'Unexpected snippet when symbol is followed by ().');
            });
            const symbolAsLastParameter = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(7, 13), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items1 => {
                items1 = items1 instanceof vscode.CompletionList ? items1.items : items1;
                const item1 = items1.find(x => x.label === 'funcAsVariable');
                assert.equal(!item1.insertText, true, 'Unexpected snippet when symbol is a parameter inside func call');
            });
            const symbolsAsNonLastParameter = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(8, 11), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items2 => {
                items2 = items2 instanceof vscode.CompletionList ? items2.items : items2;
                const item2 = items2.find(x => x.label === 'funcAsVariable');
                assert.equal(!item2.insertText, true, 'Unexpected snippet when symbol is one of the parameters inside func call.');
            });
            yield Promise.all([
                symbolFollowedByBrackets,
                symbolAsLastParameter,
                symbolsAsNonLastParameter
            ]);
            return yield vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }), (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    });
    test('Test Completion on unimported packages', (done) => {
        const config = Object.create(vscode.workspace.getConfiguration('go'), {
            'autocompleteUnimportedPackages': { value: true }
        });
        const provider = new goSuggest_1.GoCompletionItemProvider();
        const testCases = [
            [new vscode.Position(10, 3), ['bytes']],
            [new vscode.Position(11, 6), ['Abs', 'Acos', 'Asin']]
        ];
        const uri = vscode.Uri.file(path.join(fixturePath, 'completions', 'unimportedPkgs.go'));
        vscode.workspace.openTextDocument(uri).then((textDocument) => __awaiter(void 0, void 0, void 0, function* () {
            const editor = yield vscode.window.showTextDocument(textDocument);
            const promises = testCases.map(([position, expected]) => provider.provideCompletionItemsInternal(editor.document, position, null, config).then(items => {
                items = items instanceof vscode.CompletionList ? items.items : items;
                const labels = items.map(x => x.label);
                for (const entry of expected) {
                    assert.equal(labels.indexOf(entry) > -1, true, `missing expected item in completion list: ${entry} Actual: ${labels}`);
                }
            }));
            yield Promise.all(promises);
            return yield vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }), (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    });
    test('Test Completion on unimported packages (multiple)', (done) => {
        const config = Object.create(vscode.workspace.getConfiguration('go'), {
            'gocodeFlags': { value: ['-builtin'] }
        });
        const provider = new goSuggest_1.GoCompletionItemProvider();
        const position = new vscode.Position(3, 14);
        const expectedItems = [
            {
                label: 'template (html/template)',
                import: '\nimport (\n\t"html/template"\n)\n'
            },
            {
                label: 'template (text/template)',
                import: '\nimport (\n\t"text/template"\n)\n'
            }
        ];
        const uri = vscode.Uri.file(path.join(fixturePath, 'completions', 'unimportedMultiplePkgs.go'));
        vscode.workspace.openTextDocument(uri).then((textDocument) => __awaiter(void 0, void 0, void 0, function* () {
            const editor = yield vscode.window.showTextDocument(textDocument);
            let items = yield provider.provideCompletionItemsInternal(editor.document, position, null, config);
            items = items instanceof vscode.CompletionList ? items.items : items;
            const labels = items.map(x => x.label);
            expectedItems.forEach(expectedItem => {
                items = items instanceof vscode.CompletionList ? items.items : items;
                const actualItem = items.filter(item => item.label === expectedItem.label)[0];
                if (!actualItem) {
                    assert.fail(actualItem, expectedItem, `Missing expected item in completion list: ${expectedItem.label} Actual: ${labels}`);
                    return;
                }
                assert.equal(actualItem.additionalTextEdits.length, 1);
                assert.equal(actualItem.additionalTextEdits[0].newText, expectedItem.import);
            });
            return yield vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }), (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    });
    test('Test Completion on Comments for Exported Members', (done) => {
        const provider = new goSuggest_1.GoCompletionItemProvider();
        const testCases = [
            [new vscode.Position(6, 4), ['Language']],
            [new vscode.Position(9, 4), ['GreetingText']],
            // checking for comment completions with begining of comment without space
            [new vscode.Position(12, 2), []],
            // cursor between /$/ this should not trigger any completion
            [new vscode.Position(12, 1), []],
            [new vscode.Position(12, 4), ['SayHello']],
            [new vscode.Position(17, 5), ['HelloParams']],
            [new vscode.Position(26, 5), ['Abs']],
        ];
        const uri = vscode.Uri.file(path.join(fixturePath, 'completions', 'exportedMemberDocs.go'));
        vscode.workspace.openTextDocument(uri).then((textDocument) => __awaiter(void 0, void 0, void 0, function* () {
            const editor = yield vscode.window.showTextDocument(textDocument);
            const promises = testCases.map(([position, expected]) => provider.provideCompletionItems(editor.document, position, null).then(items => {
                const labels = items.items.map(x => x.label);
                assert.equal(expected.length, labels.length, `expected number of completions: ${expected.length} Actual: ${labels.length} at position(${position.line + 1},${position.character + 1}) ${labels}`);
                expected.forEach((entry, index) => {
                    assert.equal(entry, labels[index], `mismatch in comment completion list Expected: ${entry} Actual: ${labels[index]}`);
                });
            }));
            yield Promise.all(promises);
            return yield vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }), (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    });
    test('getImportPath()', () => {
        const testCases = [
            ['import "github.com/sirupsen/logrus"', 'github.com/sirupsen/logrus'],
            ['import "net/http"', 'net/http'],
            ['"github.com/sirupsen/logrus"', 'github.com/sirupsen/logrus'],
            ['', ''],
            ['func foo(bar int) (int, error) {', ''],
            ['// This is a comment, complete with punctuation.', '']
        ];
        testCases.forEach(run => {
            assert.equal(run[1], util_1.getImportPath(run[0]));
        });
    });
    test('goPlay - success run', (done) => {
        const goplayPath = util_1.getBinPath('goplay');
        if (goplayPath === 'goplay') {
            return done();
        }
        const validCode = `
			package main
			import (
				"fmt"
			)
			func main() {
				for i := 1; i < 4; i++ {
					fmt.Printf("%v ", i)
				}
				fmt.Print("Go!")
			}`;
        const goConfig = Object.create(vscode.workspace.getConfiguration('go'), {
            'playground': { value: { run: true, openbrowser: false, share: false } }
        });
        goPlayground_1.goPlay(validCode, goConfig['playground']).then(result => {
            assert(result.includes('1 2 3 Go!'));
        }, (e) => {
            assert.ifError(e);
        }).then(() => done(), done);
    });
    test('goPlay - success run & share', (done) => {
        const goplayPath = util_1.getBinPath('goplay');
        if (goplayPath === 'goplay') {
            return done();
        }
        const validCode = `
			package main
			import (
				"fmt"
			)
			func main() {
				for i := 1; i < 4; i++ {
					fmt.Printf("%v ", i)
				}
				fmt.Print("Go!")
			}`;
        const goConfig = Object.create(vscode.workspace.getConfiguration('go'), {
            'playground': { value: { run: true, openbrowser: false, share: true } }
        });
        goPlayground_1.goPlay(validCode, goConfig['playground']).then(result => {
            assert(result.includes('1 2 3 Go!'));
            assert(result.includes('https://play.golang.org/'));
        }, (e) => {
            assert.ifError(e);
        }).then(() => done(), done);
    });
    test('goPlay - fail', (done) => {
        const goplayPath = util_1.getBinPath('goplay');
        if (goplayPath === 'goplay') {
            return done();
        }
        const invalidCode = `
			package main
			import (
				"fmt"
			)
			func fantasy() {
				fmt.Print("not a main package, sorry")
			}`;
        const goConfig = Object.create(vscode.workspace.getConfiguration('go'), {
            'playground': { value: { run: true, openbrowser: false, share: false } }
        });
        goPlayground_1.goPlay(invalidCode, goConfig['playground']).then(result => {
            assert.ifError(result);
        }, (e) => {
            assert.ok(e);
        }).then(() => done(), done);
    });
    test('Build Tags checking', (done) => {
        const config1 = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'off' },
            'lintOnSave': { value: 'off' },
            'buildOnSave': { value: 'package' },
            'buildTags': { value: 'randomtag' }
        });
        const checkWithTags = goCheck_1.check(vscode.Uri.file(path.join(fixturePath, 'buildTags', 'hello.go')), config1).then(diagnostics => {
            assert.equal(1, diagnostics.length, 'check with buildtag failed. Unexpected errors found');
            assert.equal(1, diagnostics[0].errors.length, 'check with buildtag failed. Unexpected errors found');
            assert.equal(diagnostics[0].errors[0].msg, 'undefined: fmt.Prinln');
        });
        const config2 = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'off' },
            'lintOnSave': { value: 'off' },
            'buildOnSave': { value: 'package' },
            'buildTags': { value: 'randomtag othertag' }
        });
        const checkWithMultipleTags = goCheck_1.check(vscode.Uri.file(path.join(fixturePath, 'buildTags', 'hello.go')), config2).then(diagnostics => {
            assert.equal(1, diagnostics.length, 'check with multiple buildtags failed. Unexpected errors found');
            assert.equal(1, diagnostics[0].errors.length, 'check with multiple buildtags failed. Unexpected errors found');
            assert.equal(diagnostics[0].errors[0].msg, 'undefined: fmt.Prinln');
        });
        const config3 = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'off' },
            'lintOnSave': { value: 'off' },
            'buildOnSave': { value: 'package' },
            'buildTags': { value: '' }
        });
        const checkWithoutTags = goCheck_1.check(vscode.Uri.file(path.join(fixturePath, 'buildTags', 'hello.go')), config3).then(diagnostics => {
            assert.equal(1, diagnostics.length, 'check without buildtags failed. Unexpected errors found');
            assert.equal(1, diagnostics[0].errors.length, 'check without buildtags failed. Unexpected errors found');
            assert.equal(diagnostics[0].errors[0].msg.indexOf('can\'t load package: package test/testfixture/buildTags') > -1, true, `check without buildtags failed. Go files not excluded. ${diagnostics[0].errors[0].msg}`);
        });
        Promise.all([checkWithTags, checkWithMultipleTags, checkWithoutTags]).then(() => done(), done);
    });
    test('Test Tags checking', (done) => {
        const config1 = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'off' },
            'lintOnSave': { value: 'off' },
            'buildOnSave': { value: 'package' },
            'testTags': { value: null },
            'buildTags': { value: 'randomtag' }
        });
        const config2 = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'off' },
            'lintOnSave': { value: 'off' },
            'buildOnSave': { value: 'package' },
            'testTags': { value: 'randomtag' }
        });
        const config3 = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'off' },
            'lintOnSave': { value: 'off' },
            'buildOnSave': { value: 'package' },
            'testTags': { value: 'randomtag othertag' }
        });
        const config4 = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'off' },
            'lintOnSave': { value: 'off' },
            'buildOnSave': { value: 'package' },
            'testTags': { value: '' }
        });
        const uri = vscode.Uri.file(path.join(fixturePath, 'testTags', 'hello_test.go'));
        vscode.workspace.openTextDocument(uri).then(document => {
            return vscode.window.showTextDocument(document).then(editor => {
                return goTest_1.testCurrentFile(config1, false, []).then((result) => {
                    assert.equal(result, true);
                    return goTest_1.testCurrentFile(config2, false, []).then((result) => {
                        assert.equal(result, true);
                        return goTest_1.testCurrentFile(config3, false, []).then((result) => {
                            assert.equal(result, true);
                            return goTest_1.testCurrentFile(config4, false, []).then((result) => {
                                assert.equal(result, false);
                                return Promise.resolve();
                            });
                        });
                    });
                });
            });
        }).then(done, done);
    }).timeout(10000);
    test('Add imports when no imports', (done) => {
        const uri = vscode.Uri.file(path.join(fixturePath, 'importTest', 'noimports.go'));
        vscode.workspace.openTextDocument(uri).then(document => {
            return vscode.window.showTextDocument(document).then(editor => {
                const expectedText = document.getText() + '\n' + 'import (\n\t"bytes"\n)\n';
                const edits = goImport_1.getTextEditForAddImport('bytes');
                const edit = new vscode.WorkspaceEdit();
                edit.set(document.uri, edits);
                return vscode.workspace.applyEdit(edit).then(() => {
                    assert.equal(vscode.window.activeTextEditor.document.getText(), expectedText);
                    return Promise.resolve();
                });
            });
        }).then(() => done(), done);
    });
    test('Add imports to an import block', (done) => {
        const uri = vscode.Uri.file(path.join(fixturePath, 'importTest', 'groupImports.go'));
        vscode.workspace.openTextDocument(uri).then((document) => __awaiter(void 0, void 0, void 0, function* () {
            const editor = yield vscode.window.showTextDocument(document);
            const expectedText = document.getText().replace('\t"fmt"\n\t"math"', '\t"bytes"\n\t"fmt"\n\t"math"');
            const edits = goImport_1.getTextEditForAddImport('bytes');
            const edit = new vscode.WorkspaceEdit();
            edit.set(document.uri, edits);
            yield vscode.workspace.applyEdit(edit);
            assert.equal(vscode.window.activeTextEditor.document.getText(), expectedText);
            return Promise.resolve();
        })).then(() => done(), done);
    });
    test('Add imports and collapse single imports to an import block', (done) => {
        const uri = vscode.Uri.file(path.join(fixturePath, 'importTest', 'singleImports.go'));
        vscode.workspace.openTextDocument(uri).then((document) => __awaiter(void 0, void 0, void 0, function* () {
            const editor = yield vscode.window.showTextDocument(document);
            const expectedText = document.getText().replace('import "fmt"\nimport . "math" // comment', 'import (\n\t"bytes"\n\t"fmt"\n\t. "math" // comment\n)');
            const edits = goImport_1.getTextEditForAddImport('bytes');
            const edit = new vscode.WorkspaceEdit();
            edit.set(document.uri, edits);
            yield vscode.workspace.applyEdit(edit);
            assert.equal(vscode.window.activeTextEditor.document.getText(), expectedText);
            return Promise.resolve();
        })).then(() => done(), done);
    });
    test('Fill struct', (done) => {
        const uri = vscode.Uri.file(path.join(fixturePath, 'fillStruct', 'input_1.go'));
        const golden = fs.readFileSync(path.join(fixturePath, 'fillStruct', 'golden_1.go'), 'utf-8');
        vscode.workspace.openTextDocument(uri).then((textDocument) => __awaiter(void 0, void 0, void 0, function* () {
            const editor = yield vscode.window.showTextDocument(textDocument);
            const selection = new vscode.Selection(12, 15, 12, 15);
            editor.selection = selection;
            yield goFillStruct_1.runFillStruct(editor);
            assert.equal(vscode.window.activeTextEditor.document.getText(), golden);
            return Promise.resolve();
        })).then(() => done(), done);
    }).timeout(10000);
    test('Fill struct - select line', (done) => {
        const uri = vscode.Uri.file(path.join(fixturePath, 'fillStruct', 'input_2.go'));
        const golden = fs.readFileSync(path.join(fixturePath, 'fillStruct', 'golden_2.go'), 'utf-8');
        vscode.workspace.openTextDocument(uri).then((textDocument) => __awaiter(void 0, void 0, void 0, function* () {
            const editor = yield vscode.window.showTextDocument(textDocument);
            const selection = new vscode.Selection(7, 0, 7, 10);
            editor.selection = selection;
            yield goFillStruct_1.runFillStruct(editor);
            assert.equal(vscode.window.activeTextEditor.document.getText(), golden);
            return Promise.resolve();
        })).then(() => done(), done);
    }).timeout(10000);
});
//# sourceMappingURL=extension.test.js.map