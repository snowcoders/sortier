var configs = require("@snowcoders/renovate-config");

module.exports = {
  ...configs.sortier,
  js: {
    ...configs.sortier.js,
    sortClassContents: {
      isAscending: true,
      order: "usage",
      overrides: [
        // Overrides for react components
        "getDerivedStateFromProps",
        "componentWillMount",
        "componentDidMount",
        "shouldComponentUpdate",
        "componentWillUnmount",
        "componentDidUnmount",
        "render",
        "*"
      ]
    }
  }
};
