import { Doc, Param } from "../doc";
import Variable from "./variable";

/**
 * Represents an var block for `foreach`
 */
export default class Foreach extends Variable
{

    /**
     * @inheritdoc
     */
    protected pattern:RegExp = /^\s*foreach\s*\(.*?as\s+(\$[a-z_][a-z0-9_]*\s*=>\s*)?(\$[a-z_][a-z0-9_]*)\s*\)/im;

    /**
     * @inheritdoc
     */
    public parse():Doc
    {
        let params = this.match();
        return this.parseVar(params[2]);
    }
}

