import * as cosmiconfig from "cosmiconfig";
import { sync } from "globby";

import { Reprinter, ReprinterOptions } from "../reprinter";

export class Main {
    public run(args: string[]) {
        if (args.length === 0) {
            throw new Error("Must provide a file pattern to run sortier over");
        }

        this.resolveConfig((options: ReprinterOptions) => {
            sync(args).map(filePath => {
                try {
                    Reprinter.rewrite(filePath, options);
                } catch (e) {
                    console.error("Sorting " + filePath + " has failed!");
                    throw e;
                }
            });
        });
    }

    private resolveConfig(onLoad: (options: ReprinterOptions) => void) {
        cosmiconfig("sortier").load()
            .then((result: ReprinterOptions) => {
                onLoad({
                    sortImportDeclarations: result.sortImportDeclarations,
                    sortImportDeclarationSpecifiers: result.sortImportDeclarationSpecifiers,
                });
            })
            .catch((parsingError) => {
                console.log("No sortier config file found... using defaults...");
                onLoad({});
            });
    }
}
