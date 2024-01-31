import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Oauth2Config} from "@app/configurations/security/oauth2-config";
import {
  AppConfigurationLoaderService,
  getApiUrl
} from "@app/configurations/config/services/app-configuration-loader.service";
import {IdpRegistration} from "@app/configurations/security/models/Idp-registration";
import {SsoConfig} from "@app/configurations/security/models/sso-config";
import {IdpServer} from "@app/configurations/security/models/idp-server";
import {AuthResponse} from "@app/configurations/security/models/auth-response";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _idRegistrations: IdpRegistration[];
  private _isLoggedIn: boolean = false;
  private _intervalId: number;

  private readonly URI: string = "/auth/v1";
  private readonly IDP_REGISTRATION_KEY: string = "IDP_REGISTRATION_ID";
  private readonly ID_TOKEN_KEY: string = "ID_TOKEN_KEY";
  private readonly AUTH_TOKEN_MAX_AGE_KEY: string = "AUTH_TOKEN_MAX_AGE_KEY";
  private readonly PERCENTAGE_REFRESH_TOKEN_TIMEOUT: number = 0.8;
  
  private oauth2Config: Oauth2Config = new Oauth2Config();

  constructor(private http: HttpClient,
              private appConfig: AppConfigurationLoaderService) {
  }

  public initOauth2(): void {
    this.oauth2Config.initPkceCodeFlow()
    .then((): void => {
      this.oauth2Config.validateState();
      this.oauth2Config.setAuthorizationCode();
      this._idRegistrations = this.getIdpRegistrations();
      this.oauth2Config.cleanUrl();
    });
  }

  public checkIsloggedIn(): void {
    this.http.get<boolean>(`${getApiUrl()}${this.URI}/isLoggedIn`)
    .subscribe((value: boolean): void => {
      this._isLoggedIn = value;
      if (!this._isLoggedIn) {
        this.getTokens()
      } else {
        this.autoStartRefreshTokenWorker();
      }
    })
  }

  public login(idp: IdpRegistration): void {
    this.setIdpRegistrationId(idp.registrationId);
    location.href = idp.url;
  }

  public logout(): void {
    const urlParams: string = new HttpParams()
    .set("registrationId", this.getIdpRegistrationId()).toString();

    this.http.post<void>(`${getApiUrl()}${this.URI}/logout?${urlParams}`, {})
    .subscribe((): void => {
      localStorage.clear();
      location.href = "/";
    });
  }

  public getTokens(): void {
    if (this.oauth2Config.authorizationCodeExist()) {
      const urlParams = new HttpParams()
      .set("registrationId", this.getIdpRegistrationId())
      .set("codeVerifier", this.oauth2Config.getCodeVerifier())
      .set("code", this.oauth2Config.getAuthorizationCode());

      this.http.get<AuthResponse>(`${getApiUrl()}${this.URI}/oauth-token`, {params: urlParams})
      .subscribe((value: AuthResponse): void => this.afterTokenRetrieval(value));
    }
  }


  public refreshTokens(): void {
    const urlParams = new HttpParams()
    .set("registrationId", this.getIdpRegistrationId());

    this.http.get<AuthResponse>(`${getApiUrl()}${this.URI}/refresh-token`, {params: urlParams})
    .subscribe((value: AuthResponse): void => this.afterTokenRetrieval(value))
  }

  public get idRegistrations(): IdpRegistration[] {
    return this._idRegistrations;
  }

  public get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  private autoStartRefreshTokenWorker(): void {
    if (this.ssoConfig().autoRefreshToken) {
      this.stopAutoRefreshTokenWorker();
      this._intervalId = window.setInterval((): void => {
        this.refreshTokens();
      }, this.accessTokenMaxAgeMilliseconds());
    }
  }

  private stopAutoRefreshTokenWorker(): void {
    window.clearTimeout(this._intervalId);
  }

  private accessTokenMaxAgeMilliseconds(): number {
    const maxAgeSecondsString: string = localStorage.getItem(this.AUTH_TOKEN_MAX_AGE_KEY) || "0";
    const maxAgeSeconds: number = parseInt(maxAgeSecondsString);
    return maxAgeSeconds * 1000 * this.PERCENTAGE_REFRESH_TOKEN_TIMEOUT;
  }

  private setIdpRegistrationId(registrationId: string): void {
    localStorage.setItem(this.IDP_REGISTRATION_KEY, registrationId);
  }

  private getIdpRegistrationId(): string {
    return localStorage.getItem(this.IDP_REGISTRATION_KEY);
  }

  private getIdpRegistrations(): IdpRegistration[] {
    const sso: SsoConfig = this.ssoConfig();
    return sso?.idpServers
    .map((idpServer: IdpServer) => this.getIdpRegistration(idpServer, sso.redirectUri));
  }

  private getIdpRegistration(idpServer: IdpServer, redirectUri: string): IdpRegistration {
    const authUrl: string = this.oauth2Config.getAuthCodeFlowUrl(
      idpServer.authUrl,
      redirectUri,
      idpServer.clientId,
    );
    return {
      registrationId: idpServer.registrationId,
      url: authUrl,
      label: idpServer.label
    };
  }

  private ssoConfig(): SsoConfig {
    return this.appConfig?.getConfiguration()?.ssoConfig;
  }

  private afterTokenRetrieval(authResponse: AuthResponse): void {
    this.oauth2Config.clearAuthorizationCode();
    this._isLoggedIn = true;

    this.processAuthResponse(authResponse);
    this.autoStartRefreshTokenWorker();
  }

  private processAuthResponse(authResponse: AuthResponse): void {
    localStorage.setItem(this.ID_TOKEN_KEY, authResponse.idToken);
    localStorage.setItem(this.AUTH_TOKEN_MAX_AGE_KEY, authResponse.expires_in.toString());
  }
}
