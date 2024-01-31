export class Oauth2Config {
  private readonly PKCE_STATE_KEY = "auth_state";
  private readonly PKCE_CODE_VERIFIER = "auth_code_verifier";
  private readonly PKCE_CODE_CHALLENGE = "auth_code_challenge";
  private readonly PKCE_AUTHORISATION_CODE = "auth_authorisation_code";

  public async initPkceCodeFlow(): Promise<void> {
    const verifier = this.generateCodeVerifier();
    const challenge = await this.generateChallenge(verifier);
    const state = await this.generateState(8);

    this.addItemInStorage(this.PKCE_CODE_VERIFIER, verifier);
    this.addItemInStorage(this.PKCE_CODE_CHALLENGE, challenge);
    this.addItemInStorage(this.PKCE_STATE_KEY, state);
  }

  public getAuthCodeFlowUrl(
    authUri: string,
    redirectUri: string,
    clientId: string,
  ): string {
    const response_type = `response_type=code`;
    const code_challenge_method = `code_challenge_method=S256`;
    const scope = `scope=openid`;
    const client_id = `client_id=${clientId}`;
    const redirect_uri = `redirect_uri=${redirectUri}`;
    const state = `state=${this.getState()}`;
    const code_challenge = `code_challenge=${this.getCodeChallenge()}`;

    return `${authUri}?${response_type}&${code_challenge_method}&${scope}&${client_id}&${redirect_uri}&${state}&${code_challenge}`;
  }

  public validateState(): void {
    if (!this.isStateValid()) {
      throw new Error("Client auth state does not match Auth server state");
    }
  }

  public getCodeVerifier(): string {
    return localStorage.getItem(this.PKCE_CODE_VERIFIER);
  }

  public getAuthorizationCode(): string {
    return localStorage.getItem(this.PKCE_AUTHORISATION_CODE);
  }

  public clearAuthorizationCode(): void {
    localStorage.removeItem(this.PKCE_AUTHORISATION_CODE);
  }

  public authorizationCodeExist(): boolean {
    return this.itemExistsInStorage(this.PKCE_AUTHORISATION_CODE)
  }

  public setAuthorizationCode(): void {
    this.addItemInStorage(this.PKCE_AUTHORISATION_CODE, this.getParamFromUrl("code"));
  }

  public cleanUrl(): void {
    const href =
      location.origin +
      location.pathname +
      location.search
      .replace(/code=[^&$]*/, "")
      .replace(/scope=[^&$]*/, "")
      .replace(/state=[^&$]*/, "")
      .replace(/session_state=[^&$]*/, "")
      .replace(/iss=[^&$]*/, "")
      .replace(/^\?&/, "?")
      .replace(/&$/, "")
      .replace(/^\?$/, "")
      .replace(/&+/g, "&")
      .replace(/\?&/, "?")
      .replace(/\?$/, "") +
      location.hash;

    history.replaceState(null, window.name, href);
  }

  public getParamFromUrl(param: string): string {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(param);
  }

  private isStateValid(): boolean {
    const receivedState = this.getParamFromUrl("state");
    const localState = this.getState();

    if (!this.isNullOrUndefined(receivedState) && !this.isNullOrUndefined(localState)) {
      return receivedState === localState;
    }
    return true;
  }

  private addItemInStorage(key: string, value: string): void {
    if (value && !this.itemExistsInStorage(key)) {
      localStorage.setItem(key, value);
    }
  }

  private getState(): string {
    return localStorage.getItem(this.PKCE_STATE_KEY);
  }

  private getCodeChallenge(): string {
    return localStorage.getItem(this.PKCE_CODE_CHALLENGE);
  }

  private itemExistsInStorage(key: string): boolean {
    const value = localStorage.getItem(key);
    return value !== null && value !== undefined;
  }

  private base64URLEncode(str: string): string {
    const b64 = btoa(str);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  private generateCodeVerifier(): string {
    const randomCode = this.randomCode();
    return this.base64URLEncode(randomCode);
  }

  private async generateChallenge(codeVerifierString: string): Promise<string> {
    return await this.sha256(codeVerifierString);
  }

  private async generateState(length: number): Promise<string> {
    const buffer = new Uint8Array(Math.ceil((length * 3) / 4));
    window.crypto.getRandomValues(buffer);

    const base64 = btoa(String.fromCharCode.apply(null, buffer));
    return base64.replace(/[^A-Za-z0-9]/g, "").slice(0, length);
  }

  private randomCode(): string {
    let array = new Uint8Array(32);
    array = globalThis.crypto.getRandomValues(array);
    return String.fromCharCode.apply(null, Array.from(array));
  }

  private sha256 = async (str: string): Promise<string> => {
    const digestOp = await crypto.subtle.digest(
      {name: "SHA-256"},
      new TextEncoder().encode(str),
    );
    return this.bufferToBase64UrlEncoded(digestOp);
  };

  private bufferToBase64UrlEncoded = (hash: ArrayBuffer): string => {
    const uintArray = new Uint8Array(hash);
    const numberArray = Array.from(uintArray);
    const hashString = String.fromCharCode(...numberArray);
    return this.urlEncodeB64(this.base64(hashString));
  };

  private base64(data: string): string {
    return btoa(data);
  }

  private urlEncodeB64 = (input: string) => {
    const b64Chars: { [index: string]: string } = {
      "+": "-",
      "/": "_",
      "=": "",
    };
    return input.replace(/[+/=]/g, (m: string) => b64Chars[m]);
  };

  private isNullOrUndefined(value: any): boolean {
    return value === null || value === undefined;
  }
}
