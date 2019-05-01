
export class Application {

  private static instance : Application = null;

  get isDebug () {
    return !!process.env.DEBUG;
  }

  private constructor (
    config : any = null,
  ) {
    this.loadEnvironment(config);
  }

  private loadEnvironment(config : any) {
    Object.keys(config)
      .forEach(key => {
        if (config[key]) {
          process.env[key.toUpperCase()] = config[key]
        }
      });
  }

  static instantiate (config) {
    return Application.instance || (Application.instance = new Application(config));
  }
}

