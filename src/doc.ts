import {workspace, SnippetString, WorkspaceConfiguration} from 'vscode';
import Config from './util/config';

/**
 * Represents a comment block.
 *
 * This class collects data about the snippet then builds
 * it with the appropriate tags
 */
export class Doc
{
    /**
     * List of param tags
     *
     * @type {Array<Param>}
     */
    public params:Array<Param> = [];

    /**
     * Return tag
     *
     * @type {string}
     */
    public return:string;

    /**
     * Var tag
     *
     * @type {string}
     */
    public var:string;

    /**
     * The message portion of the block
     *
     * @type {string}
     */
    public message:string;

    /**
     * Doc inline
     *
     * @type {boolean}
     */
    public inline:boolean = false;

    /**
     * Define the template for the documentor
     *
     * @type {Object}
     */
    protected _template:Object;

    /**
     * Creates an instance of Doc.
     *
     * @param {string} [message='']
     */
    public constructor(message:string = '')
    {
        this.message = message;
    }

    /**
     * Set class properties from a standard object
     *
     * @param {*} input
     */
    public fromObject(input:any):void
    {
        if (input.return !== undefined) {
            this.return = input.return;
        }
        if (input.var !== undefined) {
            this.var = input.var;
        }
        if (input.message !== undefined) {
            this.message = input.message;
        }
        if (input.inline !== undefined) {
            this.inline = input.inline;
        }
        if (input.params !== undefined && Array.isArray(input.params)) {
            this.params.length = 0;
            input.params.forEach(param => {
                this.params.push(new Param(param.type, param.name));
            });
        }
    }

    /**
     * Build all the set values into a SnippetString ready for use
     *
     * @param {boolean} [isEmpty=false]
     * @returns {SnippetString}
     */
    public build(isEmpty:boolean = false):SnippetString
    {

        let extra = Config.instance.get('extra');
        let gap = Config.instance.get('gap');
        let returnGap = Config.instance.get('returnGap');

        let returnString = "";
        let varString = "";
        let paramString = "";
        let extraString = "";
        let messageString = "";

        if (isEmpty) {
            gap = true;
            extra = [];
        }
        if (!extra) {
            extra = [];
        }

        messageString = "\${###" + (this.message != "" ? ':' : '') + this.message + "}";

        if (this.params.length) {
            paramString = "";
            this.params.forEach(param => {
                if (paramString != "") {
                    paramString += "\n";
                }
                paramString += "@param \${###:"+param.type+"} " + param.name.replace('$', '\\$');
                if (Config.instance.get('defaultParameterDescription')) {
                    paramString += " \${###:"+param.name.substr(1)+"}";
                }else{
                    paramString += " \${###:}";
                }
            });
        }

        if (this.var) {
            // @var type $name
            varString = "@var";
            let vars = this.var.split(' ');
            for (let index = 0; index < vars.length; index++) {
                if (vars[index] !== '') {
                    varString += " \${###:" + vars[index].replace('$', '\\$') + "}";
                }
            }
        }

        if (this.return && (this.return != 'void' || Config.instance.get('returnVoid'))) {
            returnString = "@return \${###:" +this.return + "}";
        }

        let extraStrings = [];
        extra.forEach(v => {
            if (v instanceof Object) {
                if (v.before || v.after) {
                    return;
                }
                let content = v.content;
                if (content && v.gapBefore) {
                    extraStrings.push("");
                }
                extraStrings.push(content);
                if (content && v.gapAfter) {
                    extraStrings.push("");
                }
            } else {
                extraStrings.push(v);
            }
        });
        extraString = extraStrings.join("\n");

        let templateArray = [];
        for (let key in this.template) {
            let propConfig = this.template[key];
            let propString:string;
            if (key == 'message' && messageString) {
                propString = messageString;
                if (gap) {
                    propConfig.gapAfter = true;
                }
            } else if (key == 'var' && varString) {
                propString = varString;
            } else if (key == 'return' && returnString) {
                propString = returnString;
                if (returnGap) {
                    propConfig.gapBefore = true;
                }
            } else if (key == 'param' && paramString) {
                propString = paramString;
            } else if (key == 'extra' && extraString) {
                propString = extraString;
            } else if (propConfig.content !== undefined) {
                propString = propConfig.content;
            }
                
            extra.forEach(v => {
                if (v instanceof Object && v.before === key) {
                    let content = v.content;
                    if (content && v.gapBefore) {
                        templateArray.push("");
                    }
                    templateArray.push(content);
                    if (content && v.gapAfter) {
                        templateArray.push("");
                    }
                }
            });

            if (propString && propConfig.gapBefore && templateArray[templateArray.length - 1] != "") {
                templateArray.push("");
            }

            if (propString) {
                templateArray.push(propString);
            }

            if (propString && propConfig.gapAfter) {
                templateArray.push("");
            }
                
            extra.forEach(v => {
                if (v instanceof Object && v.after === key) {
                    let content = v.content;
                    if (content && v.gapBefore) {
                        templateArray.push("");
                    }
                    templateArray.push(content);
                    if (content && v.gapAfter) {
                        templateArray.push("");
                    }
                }
            });
        }

        if (templateArray[templateArray.length - 1] == "") {
            templateArray.pop();
        }

        let templateString:string;

        if (this.inline && templateArray.length === 3) {
            templateString = "/** " + templateArray[2] + " " + templateArray[0] + " */";
        } else {
            templateString = templateArray.join("\n");
            templateString = "/**\n" + templateString + "\n */";
        }

        let stop = 0;
        templateString = templateString.replace(/###/gm, function():string {
            stop++;
            return stop + "";
        });

        templateString = templateString.replace(/^$/gm, " *");
        templateString = templateString.replace(/^(?!(\s\*|\/\*))/gm, " * $1");

        let snippet = new SnippetString(templateString);

        return snippet;
    }

    /**
     * Set the template for rendering
     *
     * @param {Object} template
     */
    public set template(template:Object)
    {
        this._template = template;
    }

    /**
     * Get the template
     *
     * @type {Object}
     */
    public get template():Object
    {
        if (this._template == null) {
            return {
                message: {},
                var: {},
                param: {},
                return: {},
                extra: {}
            }
        }

        return this._template;
    }
}

/**
 * A simple paramter object
 */
export class Param
{
    /**
     * The type of the parameter
     *
     * @type {string}
     */
    public type:string;

    /**
     * The parameter name
     *
     * @type {string}
     */
    public name:string;

    /**
     * Creates an instance of Param.
     *
     * @param {string} type
     * @param {string} name
     */
    public constructor(type:string, name:string)
    {
        this.type = type;
        this.name = name;
    }
}
