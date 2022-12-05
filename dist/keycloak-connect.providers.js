"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKeycloakConnectOptionProvider = exports.keycloakProvider = exports.loggerProvider = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const keycloak_connect_1 = __importDefault(require("keycloak-connect"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const keycloak_connect_module_1 = require("./keycloak-connect.module");
const logger_1 = require("./logger");
exports.loggerProvider = {
    provide: constants_1.KEYCLOAK_LOGGER,
    useFactory: (opts) => {
        if (typeof opts === 'string') {
            return new common_1.Logger(keycloak_connect_1.default.name);
        }
        if (opts.logLevels) {
            keycloak_connect_module_1.KeycloakConnectModule.logger.warn(`Option 'logLevels' will be deprecated in the future. It is recommended to override or extend NestJS logger instead.`);
        }
        if (opts.useNestLogger !== null && opts.useNestLogger === false) {
            keycloak_connect_module_1.KeycloakConnectModule.logger.warn(`Setting 'useNestLogger' to false will be deprecated in the future. It is recommended to override or extend NestJS logger instead.`);
            return new logger_1.KeycloakLogger(opts.logLevels);
        }
        return new common_1.Logger(keycloak_connect_1.default.name);
    },
    inject: [constants_1.KEYCLOAK_CONNECT_OPTIONS],
};
exports.keycloakProvider = {
    provide: constants_1.KEYCLOAK_INSTANCE,
    useFactory: (opts) => {
        const keycloakOpts = opts;
        const keycloak = new keycloak_connect_1.default({}, keycloakOpts);
        // Warn if using token validation none
        if (typeof opts !== 'string' &&
            opts.tokenValidation &&
            opts.tokenValidation === constants_1.TokenValidation.NONE) {
            keycloak_connect_module_1.KeycloakConnectModule.logger.warn(`Token validation is disabled, please only do this on development/special use-cases.`);
        }
        // Access denied is called, add a flag to request so our resource guard knows
        keycloak.accessDenied = (req, res, next) => {
            req.resourceDenied = true;
            next();
        };
        return keycloak;
    },
    inject: [constants_1.KEYCLOAK_CONNECT_OPTIONS],
};
const parseConfig = (opts, config) => {
    if (typeof opts === 'string') {
        const configPathRelative = path.join(__dirname, opts);
        const configPathRoot = path.join(process.cwd(), opts);
        let configPath;
        if (fs.existsSync(configPathRelative)) {
            configPath = configPathRelative;
        }
        else if (fs.existsSync(configPathRoot)) {
            configPath = configPathRoot;
        }
        else {
            throw new Error(`Cannot find files, looked in [ ${configPathRelative}, ${configPathRoot} ]`);
        }
        const json = fs.readFileSync(configPath);
        const keycloakConfig = JSON.parse(json.toString());
        return Object.assign(keycloakConfig, config);
    }
    return opts;
};
const createKeycloakConnectOptionProvider = (opts, config) => {
    return {
        provide: constants_1.KEYCLOAK_CONNECT_OPTIONS,
        useValue: parseConfig(opts, config),
    };
};
exports.createKeycloakConnectOptionProvider = createKeycloakConnectOptionProvider;
