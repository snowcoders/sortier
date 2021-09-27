#!/usr/bin/env node

"use strict";

import { run } from "../dist/cli/index.js";

process.exit(run(process.argv.slice(2)));
