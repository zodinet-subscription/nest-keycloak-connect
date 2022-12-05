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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const KeycloakConnect = __importStar(require("keycloak-connect"));
const constants_1 = require("../constants");
const public_decorator_1 = require("../decorators/public.decorator");
const keycloak_multitenant_service_1 = require("../services/keycloak-multitenant.service");
const util_1 = require("../util");
/**
 * An authentication guard. Will return a 401 unauthorized when it is unable to
 * verify the JWT token or Bearer header is missing.
 */
let AuthGuard = class AuthGuard {
    constructor(singleTenant, keycloakOpts, logger, multiTenant, reflector) {
        this.singleTenant = singleTenant;
        this.keycloakOpts = keycloakOpts;
        this.logger = logger;
        this.multiTenant = multiTenant;
        this.reflector = reflector;
    }
    canActivate(context) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const isUnprotected = this.reflector.getAllAndOverride(public_decorator_1.META_UNPROTECTED, [context.getClass(), context.getHandler()]);
            const skipAuth = this.reflector.getAllAndOverride(public_decorator_1.META_SKIP_AUTH, [
                context.getClass(),
                context.getHandler(),
            ]);
            // If unprotected is set skip Keycloak authentication
            if (isUnprotected && skipAuth) {
                return true;
            }
            // Extract request/response
            const [request] = (0, util_1.extractRequest)(context);
            // if is not an HTTP request ignore this guard
            if (!request) {
                return true;
            }
            const jwt = (_a = this.extractJwtFromCookie(request.cookies)) !== null && _a !== void 0 ? _a : this.extractJwt(request.headers);
            const isJwtEmpty = jwt === null || jwt === undefined;
            // Empty jwt, but skipAuth = false, isUnprotected = true allow fallback
            if (isJwtEmpty && !skipAuth && isUnprotected) {
                this.logger.verbose('Empty JWT, skipAuth disabled, and a publicly marked route, allowed for fallback');
                return true;
            }
            // Empty jwt given, immediate return
            if (isJwtEmpty) {
                this.logger.verbose('Empty JWT, unauthorized');
                throw new common_1.UnauthorizedException();
            }
            this.logger.verbose(`User JWT: ${jwt}`);
            const keycloak = yield (0, util_1.useKeycloak)(request, jwt, this.singleTenant, this.multiTenant, this.keycloakOpts);
            const isValidToken = yield this.validateToken(keycloak, jwt);
            if (isValidToken) {
                // Attach user info object
                request.user = (0, util_1.parseToken)(jwt);
                // Attach raw access token JWT extracted from bearer/cookie
                request.accessTokenJWT = jwt;
                this.logger.verbose(`Authenticated User: ${JSON.stringify(request.user)}`);
                return true;
            }
            throw new common_1.UnauthorizedException();
        });
    }
    validateToken(keycloak, jwt) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenValidation = this.keycloakOpts.tokenValidation || constants_1.TokenValidation.ONLINE;
            const gm = keycloak.grantManager;
            let grant;
            try {
                grant = yield gm.createGrant({ access_token: jwt });
            }
            catch (ex) {
                this.logger.warn(`Cannot validate access token: ${ex}`);
                // It will fail to create grants on invalid access token (i.e expired or wrong domain)
                return false;
            }
            const token = grant.access_token;
            this.logger.verbose(`Using token validation method: ${tokenValidation.toUpperCase()}`);
            try {
                let result;
                switch (tokenValidation) {
                    case constants_1.TokenValidation.ONLINE:
                        result = yield gm.validateAccessToken(token);
                        return result === token;
                    case constants_1.TokenValidation.OFFLINE:
                        result = yield gm.validateToken(token, 'Bearer');
                        return result === token;
                    case constants_1.TokenValidation.NONE:
                        return true;
                    default:
                        this.logger.warn(`Unknown validation method: ${tokenValidation}`);
                        return false;
                }
            }
            catch (ex) {
                this.logger.warn(`Cannot validate access token: ${ex}`);
            }
            return false;
        });
    }
    extractJwt(headers) {
        if (headers && !headers.authorization) {
            this.logger.verbose(`No authorization header`);
            return null;
        }
        const auth = headers.authorization.split(' ');
        // We only allow bearer
        if (auth[0].toLowerCase() !== 'bearer') {
            this.logger.verbose(`No bearer header`);
            return null;
        }
        return auth[1];
    }
    extractJwtFromCookie(cookies) {
        const cookieKey = this.keycloakOpts.cookieKey || constants_1.KEYCLOAK_COOKIE_DEFAULT;
        return cookies && cookies[cookieKey];
    }
};
AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.KEYCLOAK_INSTANCE)),
    __param(1, (0, common_1.Inject)(constants_1.KEYCLOAK_CONNECT_OPTIONS)),
    __param(2, (0, common_1.Inject)(constants_1.KEYCLOAK_LOGGER)),
    __metadata("design:paramtypes", [Object, Object, common_1.Logger,
        keycloak_multitenant_service_1.KeycloakMultiTenantService,
        core_1.Reflector])
], AuthGuard);
exports.AuthGuard = AuthGuard;
