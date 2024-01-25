# oauth2CLient
A simple typescript file that contains codes to do a PKCE code flow authentication

## Example
```
oauth2Config: Oauth2Config = new Oauth2Config();
code = null;

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
