/***
 * Somewhat simplified specification of a sequence of promise functions (functions which return a promise)
 *  The result of previous promises in the chain are passed to next promise function
 *  An initial value, x, is passed to the first promise function in the list
 *
 * Example: (with fakey non-async promise functions)
 *
 *  pchain(
 *    15,
 *    async (r) => r * 2,
 *    async (r) => r + 100,
 *    async (r) => r / 3
 *  ).then(console.log)
 *
 *  outputs:
 *  > 43.333333333333336
 */
module.exports = function (x, ...promises) {
  return new Promise((resolve, reject) => {
    promises.reduce(
      (prev, next) =>
        prev.then((...result) =>
          next(...result)
        ),
      Promise.resolve(x)
    )
      .then(resolve)
      .catch(reject)
  })
}
