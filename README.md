# oauth2CLient
A simple typescript file that contains codes to do a PKCE code flow authentication

## Example
```
oauth2Config: Oauth2Config = new Oauth2Config();
code = null;

// Init the code flow by setting the auth url, redirect-uri and the client-id
this.oauth2Config.initPkceCodeFlow().then(() => {
      this.authUrl = this.oauth2Config.getAuthCodeFlowUrl(
        "http://localhost:8083/oauth/realms/APP_LOCAL/protocol/openid-connect/auth",
        "http://localhost:4200/",
        "APP_LOCAL_CLIENT",
      );
      this.code = this.oauth2Config.getParamFromUrl("code");

      if(this.oauth2Config.isStateValid()){
         throw new Error("State is different");
      }
      this.oauth2Config.cleanUrl();
    });
}
```
The above will create a code_verifier, code_challenge and state random codes and store them in the local storage.
- The state is used with the oauth2Config.isStateValid() to check if the auth request has not been tampered with.
- The code verifier will be used to ask for oauth2 tokens
