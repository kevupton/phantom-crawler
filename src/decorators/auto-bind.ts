// import {isFunction} from "util";
//
// export function AutoBind (constructor: Function) {
//   bindAll(constructor);
//   bindAll(constructor.prototype);
// }
//
// function bindAll (obj) {
//   Object.getOwnPropertyNames(obj)
//     .filter(name => isFunction(obj[name]))
//     .forEach(name => {
//       obj[name] = obj[name].bind(obj);
//     });
// }

/**
 * @copyright 2015, Andrey Popp <8mayday@gmail.com>
 *
 * The decorator may be used on classes or methods
 * ```
 * @autobind
 * class FullBound {}
 *
 * class PartBound {
 *   @autobind
 *   method () {}
 * }
 * ```
 */
export function AutoBind (...args : any[]) {
  if (args.length === 1) {
    return boundClass(args[0]);
  }
  else {
    return boundMethod(args[0], args[1], args[2].value);
  }
}

/**
 * Use boundMethod to bind all methods on the target.prototype
 */
function boundClass (target : any) {
  // (Using reflect to get all keys including symbols)
  let keys : any[];
  // Use Reflect if exists
  if (typeof Reflect !== 'undefined' && typeof Reflect.ownKeys === 'function') {
    keys = Reflect.ownKeys(target.prototype);
  }
  else {
    keys = Object.getOwnPropertyNames(target.prototype);
    // use symbols if support is provided
    if (typeof Object.getOwnPropertySymbols === 'function') {
      keys = keys.concat(Object.getOwnPropertySymbols(target.prototype));
    }
  }

  keys.forEach(key => {
    // Ignore special case target method
    if (key === 'constructor') {
      return;
    }

    const descriptor = Object.getOwnPropertyDescriptor(target.prototype, key);

    // Only methods need binding
    if (typeof descriptor.value === 'function') {
      Object.defineProperty(target.prototype, key, boundMethod(target, key, descriptor.value));
    }
  });
  return target;
}

/**
 * Return a descriptor removing the value and returning a getter
 * The getter will return a .bind version of the function
 * and memoize the result against a symbol on the instance
 */
function boundMethod (target : any, key : string, fn : Function) {
  if (typeof fn !== 'function') {
    throw new Error(`@autobind decorator can only be applied to methods not: ${typeof fn}`);
  }

  // In IE11 calling Object.defineProperty has a side-effect of evaluating the
  // getter for the property which is being replaced. This causes infinite
  // recursion and an "Out of stack space" error.
  let definingProperty = false;

  return {
    configurable: true,
    get () {
      if (definingProperty || this === target.prototype || this.hasOwnProperty(key)) {
        return fn;
      }

      const boundFn    = fn.bind(this);
      definingProperty = true;
      Object.defineProperty(this, key, {
        value: boundFn,
        configurable: true,
        writable: true
      });
      definingProperty = false;
      return boundFn;
    }
  };
}
