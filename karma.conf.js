// Karma configuration
module.exports = function (config) {
    config.set({
        frameworks: ["karma-typescript", "mocha", "chai"],
        files: [
            { pattern: "src/**/*.ts" }
        ],

        preprocessors: {
            "**/*.ts": ["karma-typescript"]
        },
        port: 8081,
        browsers: ["jsdom"],
        reporters: ["mocha", "karma-typescript"],
        autoWatch: false,
        singleRun: true,
        concurrency: Infinity,
        // reporter options
        mochaReporter: {
            output: 'full'
        },
        karmaTypescriptConfig: {
            coverageOptions: {
                instrumentation: true,
                exclude: /\.(d|spec|test)\.ts/i,
                threshold: {
                    file: {
                        statements: -10,
                        branches: 100,
                        functions: 100,
                        lines: 100,
                    }
                }
            },
            reports: {
                "html": "coverage",
                "text-summary": ""
            }
        }
    })
}