import { sync } from "globby";
import { basename, dirname } from "path";
import { FileUtils } from "./file-utils.js";
import { StringUtils } from "./string-utils.js";
import { fileURLToPath } from "url";

interface TestTreeNode {
  children: TestTreeNode[];
  name: string;
  tests: TestInfo[];
}

interface TestInfo {
  inputFilePath: string;
  outputFilePath: string;
  testName: string;
}

type TestInputTransform = (
  inputFilePath: string,
  inputFileContents: string
) => string;

/**
 * Given a directory, reads all the files from the test_assets folder in that directory and generates
 * an array of tests information to be run.
 *
 * The file format for all files in the test_assets folder should be as follows:
 *  - Input: (category_path\.)*?test_name.input.extension.txt
 *  - Output: (category_path\.)*?test_name.output.extension.txt
 *
 * Given this, some valid examples are:
 *  - context_barrier.input.css.txt
 *  - es6.imports.input.js.txt
 *  - es6.spread.imports.input.js.txt
 *
 * @param testFileUrl The test file that has a test_assets folder as a sibling
 * @param transform The reprinting logic to transform the input code and return the output
 */
export function runTestAssetsTests(
  testFileUrl: string,
  transform: TestInputTransform
) {
  const folderPath = getFolderPathFromFileUrl(testFileUrl);
  const testNodes = getTestAssetsTree(folderPath);
  if (testNodes.length === 0) {
    throw new Error("Never expected 0 test nodes");
  }
  runNodes(testNodes, transform);
}

export function getFolderPathFromFileUrl(filePath: string) {
  return dirname(fileURLToPath(filePath));
}

/**
 * Given a directory, reads all the files from the test_assets folder in that directory and generates
 * an array of tests information to be run.
 *
 * The file format for all files in the test_assets folder should be as follows:
 *  - Input: (category_path\.)*?test_name.input.extension.txt
 *  - Output: (category_path\.)*?test_name.output.extension.txt
 *
 * Given this, some valid examples are:
 *  - context_barrier.input.css.txt
 *  - es6.imports.input.js.txt
 *  - es6.spread.imports.input.js.txt
 *
 * @param folderPath The directory that contains a test_assets folder
 * @param transform The reprinting logic to transform the input code and return the output
 * @deprecated use runTestAssetsTests instead
 */
export function runTestAssestsTests(
  folderPath: string,
  transform: TestInputTransform
) {
  const testNodes = getTestAssetsTree(folderPath);
  if (testNodes.length === 0) {
    throw new Error("Never expected 0 test nodes");
  }
  runNodes(testNodes, transform);
}

function runNodes(
  testNodes: Array<TestTreeNode>,
  transform: TestInputTransform
) {
  for (const node of testNodes) {
    if (node.children.length === 0 && node.tests.length === 0) {
      throw new Error("Test node must have children and/or tests");
    }

    describe(StringUtils.sentenceCase(node.name), () => {
      // Run all the tests
      node.tests.forEach((testInfo) => {
        it(StringUtils.sentenceCase(testInfo.testName), () => {
          const input = FileUtils.readFileContents(testInfo.inputFilePath);
          const expected = FileUtils.readFileContents(testInfo.outputFilePath);
          const actual = transform(testInfo.inputFilePath, input);

          expect(actual).toEqual(expected);
        });
      });

      // Run all the children
      runNodes(node.children, transform);
    });
  }
}

function getTestAssetsTree(folderPath: string) {
  const roots: Array<TestTreeNode> = [];

  const assetsFolderPath = FileUtils.globbyJoin(
    folderPath,
    `test_assets/*.input.*.txt`
  );
  const filePaths = sync(assetsFolderPath);
  for (const filePath of filePaths) {
    const segments = basename(filePath).split(".");
    if (segments.length < 4) {
      console.error(`${filePath} does not match getTestAssetsTree pattern`);
    }

    // Get the root node based off the extension type
    const extension = segments[segments.length - 2];
    let root = getOrInsertNodeInArray(roots, extension);

    // Now that we have the root node, setup the categories if needed
    while (segments.length > 4) {
      const category = segments.shift();
      if (category == null) {
        break;
      }
      root = getOrInsertNodeInArray(root.children, category);
    }

    const testName = segments[0].replace(/_/g, " ");

    root.tests.push({
      inputFilePath: filePath,
      outputFilePath: filePath.replace(".input.", ".output."),
      testName,
    });
  }

  return Array.from(roots.values());
}

function getOrInsertNodeInArray(array: Array<TestTreeNode>, name: string) {
  let node = array.find((value) => {
    return value.name === name;
  });
  if (node == null) {
    node = {
      children: [],
      name,
      tests: [],
    };
    array.push(node);
  }
  return node;
}
