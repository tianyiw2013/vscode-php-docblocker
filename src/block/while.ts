import { Doc, Param } from "../doc";
import Variable from "./variable";

/**
 * Represents an var block for `while`
 */
export default class While extends Variable
{

    /**
     * @inheritdoc
     */
    protected pattern:RegExp = /^\s*while\s*\((\$[a-z0-9_]+)\s*=(?!=)/im;

    /**
     * @inheritdoc
     */
    public parse():Doc
    {
        let params = this.match();
        return this.parseVar(params[1]);
    }
}

