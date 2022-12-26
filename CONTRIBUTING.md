# Contributing

## Repository setup

Simply clone down the repo, `npm install` and you should be good to go. You can run `npm start` to verify.

## Branch design

Sortier uses a single branch for everything; the `main` branch

## Testing

Most folders have a test_assets folder which multiple pairs of files consisting of an input and an output. The file names pattern is `describe.tree.path.test_title_separated_by_underscores.(input|output).file_extension.txt`. We found it easier to compare the input and output via files than via the console output. An example of this pattern being under ./src/language-js/sortExpression/test_assets is:

- es6.integer_order.input.js.txt
- es6.integer_order.output.js.txt

Finally, running `npm run test -- "./src/language-js/sortExpression"` will execute that test and all the tests in that suite.

## Developing and Debugging

When adding new features we start with test driven development. This means we create a set of test assets that show the input and output we expect and then build the code around it. In your test file, you'll likely find a function that looks like this:

```
runTestAssetsTests(
    import.meta.url,
    (inputFilePath: string, inputFileContents: string) => {
        const parser = getParser(inputFilePath);
        const parsed = parser(inputFileContents);

        const actual = sortSwitchCases(
            parsed.body[0].cases || parsed.body[0].body.body[0].cases,
            parsed.comments,
            inputFileContents,
            {}
        );
        return actual;
    });
```

This is testing all the asset files in the test_asset folder next to the test file. To debug a specific test, through VS Code you add a breakpoint to check whether `inputFilePath` is the file you intend to debug. Then go to the Run and Debug View and run Debug Relative Jest Tests which will run the tests in the currently open coding editor.

## Releases

1. Pull down the latest of the main
1. Create a release branch (e.g. `release-latest`)
1. Run `npm version <version number here>` (beta or otherwise)
1. Merge all the beta versions for the current version number into one changelog entry
1. Commit using `git commit -a --amend --no-edit`
1. Push the new branch to the server (e.g. `git push`)
1. Create a PR from your release branch into `main`
1. Get it merged
1. The actual publish, git tag and git release is all automated. You can monitor it's progress via the [Github Actions](https://github.com/snowcoders/sortier/actions/workflows/publish.yml) section.
