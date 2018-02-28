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
                    console.error(e);
                }
            });
        });
    }

    private resolveConfig(onLoad: (options: ReprinterOptions) => void) {
        cosmiconfig("sortier").load()
            .then((result: { config: ReprinterOptions, filepath: string }) => {
                onLoad(result.config);
            })
            .catch((parsingError) => {
                console.warn("No valid sortier config file found");
                console.warn("Error: " + parsingError);
                console.warn("Using defaults...");
                onLoad({});
            });
    }
}
