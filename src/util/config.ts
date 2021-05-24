import { workspace, TextEditor, Range, Position, TextDocument, WorkspaceConfiguration } from "vscode";
import * as fs from 'fs';

/**
 * Provides helper function to types
 */
export default class Config {

    /**
    * Holds the current instance
    *
    * @type {Config}
    */
    private static _instance: Config;

    /**
     * Data to use when we aren't in live mode
     *
     * @type {Object}
     */
    private data:{}

    /**
     * Are we in test mode or live
     *
     * @type {boolean}
     */
    private isLive:boolean = true;

    /**
     * Returns the instance for this util
     *
     * @returns {Config}
     */
    public static get instance(): Config {
        if (this._instance == null) {
            this._instance = new this();
            this._instance.load();
        }
        return this._instance;
    }

    /**
     * Set whether this is live mode or not
     *
     * @param {boolean} bool
     */
    public set live(bool:boolean)
    {
        this.isLive = bool;
    }

    /**
     * Load in the defaults or the config
     */
    public load()
    {
        if (!this.isLive) {
            let config = {};
            let packageJson = JSON.parse(fs.readFileSync(__dirname + '/../../../package.json').toString());
            let props = packageJson.contributes.configuration.properties;
            for (var key in props) {
                var item = props[key];
                config[key.replace('php-docblocker2.', '')] = item.default;
            }

            this.data = config;
        }
    }

    /**
     * Add overrides
     *
     * @param overrides
     */
    public override(overrides)
    {
        this.data = {...this.data, ...overrides};
    }

    /**
     * Get a settings from the config or the mocked config
     *
     * @param {string} setting
     */
    public get(setting:string)
    {
        if (this.isLive) {
            return workspace.getConfiguration('php-docblocker2').get(setting);
        }

        return this.data[setting];
    }
}
