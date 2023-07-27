export class AppConfig {
    public gridSnap = 0;
    public rotateSnap = 0;
    public gridSnapArray =
        [0, 0.1, 0.5, 1];
    public rotateSnapArray =
        [0, 22.5, 45, 90]

    private static _config: AppConfig;

    public static get config() {
        if (!AppConfig._config) {
            AppConfig._config = new AppConfig();
        }
        return AppConfig._config;

    }

}