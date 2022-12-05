import KeycloakConnect from 'keycloak-connect';
import { KeycloakConnectOptions } from '../interface/keycloak-connect-options.interface';
/**
 * Stores all keycloak instances when multi tenant option is defined.
 */
export declare class KeycloakMultiTenantService {
    private keycloakOpts;
    private instances;
    constructor(keycloakOpts: KeycloakConnectOptions);
    /**
     * Clears the cached Keycloak instances.
     */
    clear(): void;
    /**
     * Retrieves a keycloak instance based on the realm provided.
     * @param realm the realm to retrieve from
     * @returns the multi tenant keycloak instance
     */
    get(realm: string): Promise<KeycloakConnect.Keycloak>;
    resolveSecret(realm: string): Promise<string>;
}
