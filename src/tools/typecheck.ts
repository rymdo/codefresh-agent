export class TypeCheck {
  static isBoolean(data: any): data is boolean {
    return typeof data === "boolean";
  }

  static isNumber(data: any): data is number {
    return !!data && typeof data === "number";
  }

  static isString(data: any): data is string {
    return !!data && typeof data === "string";
  }

  static isListOfStrings(data: any): data is string[] {
    if (!data) {
      return false;
    }
    if (!Array.isArray(data)) {
      return false;
    }
    for (const element of data) {
      if (!this.isString(element)) {
        return false;
      }
    }
    return true;
  }

  static isKeyValueObject(data: any): data is { key: string; value: string } {
    if (!data) {
      return false;
    }
    if (!data.key || !(typeof data.key === "string")) {
      return false;
    }
    if (!data.value || !(typeof data.value === "string")) {
      return false;
    }
    return true;
  }

  static isKeyValueObjectList(
    data: any
  ): data is { key: string; value: string }[] {
    if (!data) {
      return false;
    }
    if (!Array.isArray(data)) {
      return false;
    }
    for (const element of data) {
      if (!this.isKeyValueObject(element)) {
        return false;
      }
    }
    return true;
  }
}
