/**
 * Creates a temporary function which will be limited based on the inputs.
 * @param addCallback
 * @param deleteCallback
 * @param handle
 * @param execTimes
 * @param duration
 * @param promise
 */
export function temporaryEvent (
  addCallback : (fn : Function) => void,
  deleteCallback : (fn : Function) => void,
  handle : Function,
  execTimes? : number,
  duration? : number,
  promise? : Promise<void>
) {
  const state = {
    timeout: 0,
    execTimes,
    promise,
    deleted: false
  };

  const temporaryFn : Function = temporaryFunction;

  if (duration) {
    state.timeout = setTimeout(deleteFn, duration) as any;
  }

  if (promise) {
    promise.then(deleteFn);
  }

  return addCallback(temporaryFn);

  function temporaryFunction () {
    if (execTimes && state.execTimes) state.execTimes--;

    handle.apply(null, arguments);

    if (state.execTimes && state.execTimes <= 0) deleteFn();
  }

  function deleteFn () {
    if (state.deleted) return;

    state.deleted = true;

    deleteCallback(temporaryFn);

    if (state.timeout) clearTimeout(state.timeout);
  }
}
