import { expect } from "chai";
import { sync } from "globby";
import { basename } from "path";
import { FileUtils } from "./file-utils";
import { StringUtils } from "./string-utils";

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

type Executor = (inputFilePath: string, inputFileContents: string) => string;

export function runTestAssestsTests(folderPath: string, executor: Executor) {
  const testNodes = getTestAssetsTree(folderPath);
  if (testNodes.length === 0) {
    throw new Error("Never expected 0 test nodes");
  }
  runNodes(testNodes, executor);
}

function runNodes(testNodes: Array<TestTreeNode>, executor: Executor) {
  for (let node of testNodes) {
    if (node.children.length === 0 && node.tests.length === 0) {
      throw new Error("Test node must have children and/or tests");
    }

    describe(StringUtils.sentenceCase(node.name), () => {
      // Run all the tests
      node.tests.forEach((testInfo) => {
        it(StringUtils.sentenceCase(testInfo.testName), () => {
          let input = FileUtils.readFileContents(testInfo.inputFilePath);
          let expected = FileUtils.readFileContents(testInfo.outputFilePath);
          let actual = executor(testInfo.inputFilePath, input);

          expect(actual).to.equal(expected);
        });
      });

      // Run all the children
      runNodes(node.children, executor);
    });
  }
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
 */
function getTestAssetsTree(folderPath: string) {
  let roots: Array<TestTreeNode> = [];

  let assetsFolderPath = FileUtils.globbyJoin(
    folderPath,
    `test_assets/*.input.*.txt`
  );
  const filePaths = sync(assetsFolderPath);
  for (const filePath of filePaths) {
    let segments = basename(filePath).split(".");
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

    let testName = segments[0].replace(/_/g, " ");

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
