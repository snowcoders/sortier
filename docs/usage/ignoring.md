# Ignoring Nodes

## sortier-ignore-next-line

By adding a comment that starts with the text sortier-ignore-next-line sortier will ignore all nodes of which start and end on the next line. Nodes that start on the next line but end on a different line will still be sorted.

```ts
/* sortier-ignore-next-line - All on one line, doesn't sort */
const secondsInWeek = 60 * 60 * 24 * 7;

// prettier-ignore
// sortier-ignore-next-line - The expression on the right of the equals operator
// starts on the next line but ends on a different line so it will be sorted
const secondsInWeek = 7
 * 24
 * 60
 * 60;
```

## sortier-ignore-nodes

By adding a comment that starts with the text sortier-ignore-nodes sortier will ignore the entire node tree of any nodes which start on the next line.

```ts
// sortier-ignore-nodes - Prevents sorting the switch statement along with all descendant nodes (e.g. see "a3, a1")
switch ("a") {
  case "c":
  case "d":
    // The ignore statement stops sorting for the whole tree, not just the node above it
    let { a3, a1 } = d;
    console.log("c");
    break;
  case "b":
  case "a":
    console.log("a");
    break;
  default:
    break;
}
```
