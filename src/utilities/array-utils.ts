export class ArrayUtils {
  public static dedupe(array: any[]) {
    for (let i = 0; i < array.length; i++) {
      for (let j = i + 1; j < array.length; j++) {
        if (array[i] === array[j]) {
          array.splice(j, 1);
        }
      }
    }
  }

  public static isEqual(array1: any[], array2: any[]) {
    return (
      array1 === array2 ||
      (array1.length === array2.length &&
        array1.every((value, index) => value === array2[index]))
    );
  }
}
