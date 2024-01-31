import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {AppConfiguration} from "@app/configurations/config/models/app-configuration.interface";
import {lastValueFrom, Subject} from "rxjs";
import {environment} from "@env/environment";

declare global {
  interface Window {
    API_URL: string;
  }
}
export const getApiUrl = () => {
  return window.API_URL || "";
};

@Injectable({
  providedIn: "root",
})
export class AppConfigurationLoaderService {
  private CONFIGURATION_URL = "/assets/config/" + environment.configFilename;
  private _configuration: AppConfiguration = {
    apiUrl: "",
    ssoConfig: undefined
  };
  public configSubject$: Subject<AppConfiguration> =
    new Subject<AppConfiguration>();

  constructor(private _http: HttpClient) {
  }

  public loadConfiguration(): Promise<void> {
    return lastValueFrom(this._http.get(this.CONFIGURATION_URL)).then(
      (configuration: AppConfiguration): void => {
        this._configuration = configuration;
        this.configSubject$.next(this._configuration);

        window.API_URL = this._configuration.apiUrl;
      },
    );
  }

  public getConfiguration(): AppConfiguration {
    return this._configuration;
  }
}
