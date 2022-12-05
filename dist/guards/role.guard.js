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
exports.RoleGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const KeycloakConnect = __importStar(require("keycloak-connect"));
const constants_1 = require("../constants");
const roles_decorator_1 = require("../decorators/roles.decorator");
const keycloak_multitenant_service_1 = require("../services/keycloak-multitenant.service");
const util_1 = require("../util");
/**
 * A permissive type of role guard. Roles are set via `@Roles` decorator.
 * @since 1.1.0
 */
let RoleGuard = class RoleGuard {
    constructor(singleTenant, keycloakOpts, logger, multiTenant, reflector) {
        this.singleTenant = singleTenant;
        this.keycloakOpts = keycloakOpts;
        this.logger = logger;
        this.multiTenant = multiTenant;
        this.reflector = reflector;
    }
    canActivate(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const roleMerge = this.keycloakOpts.roleMerge
                ? this.keycloakOpts.roleMerge
                : constants_1.RoleMerge.OVERRIDE;
            const rolesMetaDatas = [];
            if (roleMerge == constants_1.RoleMerge.ALL) {
                const mergedRoleMetaData = this.reflector.getAllAndMerge(roles_decorator_1.META_ROLES, [context.getClass(), context.getHandler()]);
                if (mergedRoleMetaData) {
                    rolesMetaDatas.push(...mergedRoleMetaData);
                }
            }
            else if (roleMerge == constants_1.RoleMerge.OVERRIDE) {
                const roleMetaData = this.reflector.getAllAndOverride(roles_decorator_1.META_ROLES, [context.getClass(), context.getHandler()]);
                if (roleMetaData) {
                    rolesMetaDatas.push(roleMetaData);
                }
            }
            else {
                throw Error(`Unknown role merge: ${roleMerge}`);
            }
            const combinedRoles = rolesMetaDatas.flatMap(x => x.roles);
            if (combinedRoles.length === 0) {
                return true;
            }
            // Use matching mode of first item
            const roleMetaData = rolesMetaDatas[0];
            const roleMatchingMode = roleMetaData.mode
                ? roleMetaData.mode
                : constants_1.RoleMatchingMode.ANY;
            this.logger.verbose(`Using matching mode: ${roleMatchingMode}`);
            this.logger.verbose(`Roles: ${JSON.stringify(combinedRoles)}`);
            // Extract request
            const [request] = (0, util_1.extractRequest)(context);
            const { accessTokenJWT } = request;
            // if is not an HTTP request ignore this guard
            if (!request) {
                return true;
            }
            if (!accessTokenJWT) {
                // No access token attached, auth guard should have attached the necessary token
                this.logger.warn('No access token found in request, are you sure AuthGuard is first in the chain?');
                return false;
            }
            // Create grant
            const keycloak = yield (0, util_1.useKeycloak)(request, request.accessTokenJWT, this.singleTenant, this.multiTenant, this.keycloakOpts);
            const grant = yield keycloak.grantManager.createGrant({
                access_token: accessTokenJWT,
            });
            // Grab access token from grant
            const accessToken = grant.access_token;
            // For verbose logging, we store it instead of returning it immediately
            const granted = roleMatchingMode === constants_1.RoleMatchingMode.ANY
                ? combinedRoles.some(r => accessToken.hasRole(r))
                : combinedRoles.every(r => accessToken.hasRole(r));
            if (granted) {
                this.logger.verbose(`Resource granted due to role(s)`);
            }
            else {
                this.logger.verbose(`Resource denied due to mismatched role(s)`);
            }
            return granted;
        });
    }
};
RoleGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.KEYCLOAK_INSTANCE)),
    __param(1, (0, common_1.Inject)(constants_1.KEYCLOAK_CONNECT_OPTIONS)),
    __param(2, (0, common_1.Inject)(constants_1.KEYCLOAK_LOGGER)),
    __metadata("design:paramtypes", [Object, Object, common_1.Logger,
        keycloak_multitenant_service_1.KeycloakMultiTenantService,
        core_1.Reflector])
], RoleGuard);
exports.RoleGuard = RoleGuard;
