import { createError } from "../../common/parser-utils";
import * as babylon from "babylon";

export function parse(text: string, parsers: any, opts: any) {
    // Inline the require to avoid loading all the JS if we don't use it
    const babylonOptions = {
        sourceType: "module",
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
            "jsx",
            "flow",
            "doExpressions",
            "objectRestSpread",
            "decorators",
            "classProperties",
            "exportDefaultFrom",
            "exportNamespaceFrom",
            "asyncGenerators",
            "functionBind",
            "functionSent",
            "dynamicImport",
            "numericSeparator",
            "importMeta",
            "optionalCatchBinding",
            "optionalChaining",
            "classPrivateProperties",
            "pipelineOperator",
            "nullishCoalescingOperator"
        ]
    };

    const parseMethod =
        opts && opts.parser === "json" ? "parseExpression" : "parse";

    let ast;
    try {
        ast = babylon[parseMethod](text, babylonOptions);
    } catch (originalError) {
        try {
            ast = babylon[parseMethod](
                text,
                {
                    ...babylonOptions,
                    strictMode: false
                }
            );
        } catch (nonStrictError) {
            throw createError(
                // babel error prints (l:c) with cols that are zero indexed
                // so we need our custom error
                originalError.message.replace(/ \(.*\)/, ""),
                {
                    start: {
                        line: originalError.loc.line,
                        column: originalError.loc.column + 1
                    }
                }
            );
        }
    }
    delete ast.tokens;
    return ast;
}
