
/**
 * Sort an array of objects by a property. Include an optional valuesOrder for looking up the order of a certain value
 */
export function sortArrayByObjectProperty<T = any> (data: T[], propertyKey: keyof T, valuesOrder?: any[]): T [] {
  const sortedData = data.sort((first, second) => {
    let firstPropertyValueIndex = valuesOrder ? valuesOrder.indexOf(first[propertyKey]) : first[propertyKey];
    if (firstPropertyValueIndex === -1) {
      firstPropertyValueIndex = valuesOrder ? valuesOrder.length : data.length;
    }

    let secondPropertyValueIndex = valuesOrder ? valuesOrder.indexOf(second[propertyKey]) : second[propertyKey];
    if (secondPropertyValueIndex === -1) {
      secondPropertyValueIndex = valuesOrder ? valuesOrder.length : data.length;
    }

    // Handle
    if (firstPropertyValueIndex < secondPropertyValueIndex) {
      return -1;
    }
    else if (firstPropertyValueIndex > secondPropertyValueIndex) {
      return 1;
    }
    else {
      return 0;
    }

  });

  return sortedData;

}