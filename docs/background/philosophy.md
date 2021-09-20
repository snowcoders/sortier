# Philosophy

## Empty lines

Empty lines generally signify separations of logical code blocks. Maybe it's that you want to put all your variables at the top of the file and separate from the logic. Maybe it's that you have 4 for loops and separate them by spaces. Whatever the reason, empty lines are an important separation tool.

It's this particular reason that all of our default settings will not sort across an empty blank line. For example without a blank line:

```ts
type Props = {
  source: "NYC";
  airplane: "Boeing";
  destination: "Seattle";
  passengerCount: 50;
  cargo: false;
};
```

Is rewritten to:

```ts
type Props = {
  airplane: "Boeing";
  cargo: false;
  destination: "Seattle";
  passengerCount: 50;
  source: "NYC";
};
```

Now instead, let's put a blank line between the details about the type of plane along with it's path and the contents of the plane:

```ts
type Props = {
  source: "NYC";
  airplane: "Boeing";
  destination: "Seattle";

  passengerCount: 50;
  cargo: false;
};
```

Is rewritten to:

```ts
type Props = {
  airplane: "Boeing";
  destination: "Seattle";
  source: "NYC";

  cargo: false;
  passengerCount: 50;
};
```

Comments

Making sure we move comments and documentation for properties is extremely important as we don't want documentation to be incorrect. Using our existing example, let's add some comments for each property

```ts
type Props = {
  /*
   * Where the plane came from
   */
  source: "NYC";
  // The airplane type
  airplane: "Boeing";
  /**
   * Where the plane is going to
   */
  destination: "Seattle";

  // The number of passengers on the plane
  passengerCount: 50;
  // If the plane has any cargo
  cargo: false;
};
```

When the code is rewritten, the comments will move with the property they reference:

```ts
type Props = {
  // The airplane type
  airplane: "Boeing";
  /***
   * Where the plane is going to
   */
  destination: "Seattle";
  /*
   * Where the plane came from
   */
  source: "NYC";

  // If the plane has any cargo
  cargo: false;
  // The number of passengers on the plane
  passengerCount: 50;
};
```

Let's say instead of having comments per property, you commented the groups instead:

```ts
type Props = {
  // Flight details
  source: "NYC";
  airplane: "Boeing";
  destination: "Seattle";

  // Plane content information
  passengerCount: 50;
  cargo: false;
};
```

Sortier is smart enough to notice this and will leave the comment for the overall group:

```ts
type Props = {
  // Flight details
  airplane: "Boeing";
  destination: "Seattle";
  source: "NYC";

  // Plane content information
  cargo: false;
  passengerCount: 50;
};
```
