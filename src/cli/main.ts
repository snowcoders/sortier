import * as cosmiconfig from "cosmiconfig";
import { sync } from "globby";

import { Reprinter, ReprinterOptions } from "../reprinter";

export class Main {
    public run(args: string[]) {
        if (args.length === 0) {
            console.log("Must provide a file pattern to run sortier over");
            return -1;
        }

        const explorer = cosmiconfig("sortier");
        const result = explorer.searchSync();
        if (result == null) {
            console.log("No valid sortier config file found. Using defaults...");
        }
        let options = result == null ? {} : result.config as ReprinterOptions;

        sync(args).map(filePath => {
            try {
                Reprinter.rewrite(filePath, options);
            } catch (e) {
                console.log("");
                console.error("Sorting " + filePath + " has failed!");
                console.error("If this is an issue with sortier please provide an issue in Github with minimal source code to reproduce the issue");
                console.error(e);
            }
        });

        return 0;
    }
}
