import {HttpClientTestingModule, HttpTestingController,} from "@angular/common/http/testing";
import {TestBed} from "@angular/core/testing";
import {
  AppConfigurationLoaderService
} from "@app/configurations/config/services/app-configuration-loader.service";
import {environment} from "@env/environment";
import {AppConfiguration} from "@app/configurations/config/models/app-configuration.interface";

describe("ConfigurationLoaderService", () => {
  let httpTestingController: HttpTestingController;
  let configurationLoaderService: AppConfigurationLoaderService;

  const mockConfig = {
    apiUrl: "/myangular",
    ssoConfig: {},
  } as AppConfiguration;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppConfigurationLoaderService],
      teardown: {destroyAfterEach: false},
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    configurationLoaderService = TestBed.inject(AppConfigurationLoaderService);
  });

  /**
   * Vérify qu'aucune requête n'est en suspend.
   * Si c'est le cas elle sont annulées.
   */
  afterEach(() => {
    httpTestingController.verify();
    window.API_URL = null;
  });

  /**
   * Tester la création du service.
   */
  it("should be created", () => {
    expect(configurationLoaderService).toBeTruthy();
  });

  it("should get configuration when loadConfiguration()", () => {
    configurationLoaderService.loadConfiguration().then(() => {
      expect(configurationLoaderService.getConfiguration()).toEqual(mockConfig);
    });

    const req = httpTestingController.expectOne(
      "/assets/config/" + environment.configFilename,
    );

    req.flush(mockConfig);
  });

  it("should not get configuration when loadConfiguration() error", () => {
    configurationLoaderService.loadConfiguration().then(() => {
      expect(configurationLoaderService.getConfiguration().apiUrl).toEqual("");
      expect(
        configurationLoaderService.getConfiguration().ssoConfig,
      ).toBeUndefined();
    });

    const req = httpTestingController.expectOne(
      "/assets/config/" + environment.configFilename,
    );
    req.flush("404 not found", {status: 404, statusText: "Not Found"});
  });
});
