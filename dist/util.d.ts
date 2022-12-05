import { ExecutionContext } from '@nestjs/common';
import KeycloakConnect from 'keycloak-connect';
import { KeycloakConnectConfig } from './interface/keycloak-connect-options.interface';
import { KeycloakMultiTenantService } from './services/keycloak-multitenant.service';
export declare const useKeycloak: (request: any, jwt: string, singleTenant: KeycloakConnect.Keycloak, multiTenant: KeycloakMultiTenantService, opts: KeycloakConnectConfig) => Promise<KeycloakConnect.Keycloak>;
export declare const extractRequest: (context: ExecutionContext) => [any, any];
export declare const parseToken: (token: string) => any;
