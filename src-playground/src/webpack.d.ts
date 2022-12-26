// Webpack asset loader doesn't provide types for specific extensions becaues
// it doesn't know what the possible extensions are

declare module "*.txt" {
  const value: any;
  export default value;
}
