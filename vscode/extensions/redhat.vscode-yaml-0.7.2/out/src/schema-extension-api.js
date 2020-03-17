"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_uri_1 = require("vscode-uri");
const vscode_languageclient_1 = require("vscode-languageclient");
var MODIFICATION_ACTIONS;
(function (MODIFICATION_ACTIONS) {
    MODIFICATION_ACTIONS[MODIFICATION_ACTIONS["delete"] = 0] = "delete";
    MODIFICATION_ACTIONS[MODIFICATION_ACTIONS["add"] = 1] = "add";
})(MODIFICATION_ACTIONS = exports.MODIFICATION_ACTIONS || (exports.MODIFICATION_ACTIONS = {}));
var SchemaModificationNotification;
(function (SchemaModificationNotification) {
    SchemaModificationNotification.type = new vscode_languageclient_1.RequestType('json/schema/modify');
})(SchemaModificationNotification || (SchemaModificationNotification = {}));
class SchemaExtensionAPI {
    constructor(client) {
        this._customSchemaContributors = {};
        this._yamlClient = client;
    }
    /**
     * Register a custom schema provider
     *
     * @param {string} the provider's name
     * @param requestSchema the requestSchema function
     * @param requestSchemaContent the requestSchemaContent function
     * @returns {boolean}
     */
    registerContributor(schema, requestSchema, requestSchemaContent) {
        if (this._customSchemaContributors[schema]) {
            return false;
        }
        if (!requestSchema) {
            throw new Error("Illegal parameter for requestSchema.");
        }
        this._customSchemaContributors[schema] = {
            requestSchema,
            requestSchemaContent
        };
        return true;
    }
    /**
     * Call requestSchema for each provider and finds all matches.
     *
     * @param {string} resource
     * @returns {string} the schema uri
     */
    requestCustomSchema(resource) {
        const matches = [];
        for (let customKey of Object.keys(this._customSchemaContributors)) {
            const contributor = this._customSchemaContributors[customKey];
            const uri = contributor.requestSchema(resource);
            if (uri) {
                matches.push(uri);
            }
        }
        return matches;
    }
    /**
     * Call requestCustomSchemaContent for named provider and get the schema content.
     *
     * @param {string} uri the schema uri returned from requestSchema.
     * @returns {string} the schema content
     */
    requestCustomSchemaContent(uri) {
        if (uri) {
            let _uri = vscode_uri_1.URI.parse(uri);
            if (_uri.scheme && this._customSchemaContributors[_uri.scheme] &&
                this._customSchemaContributors[_uri.scheme].requestSchemaContent) {
                return this._customSchemaContributors[_uri.scheme].requestSchemaContent(uri);
            }
        }
    }
    modifySchemaContent(schemaModifications) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._yamlClient.sendRequest(SchemaModificationNotification.type, schemaModifications);
        });
    }
}
exports.SchemaExtensionAPI = SchemaExtensionAPI;
// constants
exports.CUSTOM_SCHEMA_REQUEST = 'custom/schema/request';
exports.CUSTOM_CONTENT_REQUEST = 'custom/schema/content';
//# sourceMappingURL=schema-extension-api.js.map