import { CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as KeycloakConnect from 'keycloak-connect';
import { KeycloakConnectConfig } from '../interface/keycloak-connect-options.interface';
import { KeycloakMultiTenantService } from '../services/keycloak-multitenant.service';
/**
 * A permissive type of role guard. Roles are set via `@Roles` decorator.
 * @since 1.1.0
 */
export declare class RoleGuard implements CanActivate {
    private singleTenant;
    private keycloakOpts;
    private logger;
    private multiTenant;
    private readonly reflector;
    constructor(singleTenant: KeycloakConnect.Keycloak, keycloakOpts: KeycloakConnectConfig, logger: Logger, multiTenant: KeycloakMultiTenantService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
