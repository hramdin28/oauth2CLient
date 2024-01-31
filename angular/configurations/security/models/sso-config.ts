import {IdpServer} from "@app/configurations/security/models/idp-server";

export interface SsoConfig {
  redirectUri: string,
  autoRefreshToken: boolean,
  idpServers: IdpServer[]
}
