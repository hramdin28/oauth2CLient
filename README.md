# oauth2CLient
- A simple typescript file that contains codes to do a PKCE code flow authentication.
- An angular example with configurations on how to use the oauth2-config.ts file
## Example
```
oauth2Config: Oauth2Config = new Oauth2Config();
code = null;

// Init the code flow by setting the auth url, redirect-uri and the client-id
  public initOauth2(): void {
    this.oauth2Config.initPkceCodeFlow()
    .then((): void => {
      this.oauth2Config.validateState();
      this.oauth2Config.setAuthorizationCode();
      this._idRegistrations = this.getIdpRegistrations();
      this.oauth2Config.cleanUrl();
    });
  }
```
The above will create a code_verifier, code_challenge and state random codes and store them in the local storage.
- The state is used with the oauth2Config.validateState() to check if the auth request has not been tampered with.
- The code verifier will be used to ask for oauth2 tokens
