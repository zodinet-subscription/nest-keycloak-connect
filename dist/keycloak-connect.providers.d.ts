import { Provider } from '@nestjs/common';
import { KeycloakConnectConfig, KeycloakConnectOptions, NestKeycloakConfig } from './interface/keycloak-connect-options.interface';
export declare const loggerProvider: Provider;
export declare const keycloakProvider: Provider;
export declare const createKeycloakConnectOptionProvider: (opts: KeycloakConnectOptions, config?: NestKeycloakConfig) => {
    provide: string;
    useValue: KeycloakConnectConfig;
};
