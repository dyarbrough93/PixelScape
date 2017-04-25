/**
 * A class to assist with validating function arguments.
 * @namespace Validation
 */
let Validation = (function(window, undefined) {

    /**
     * An illegal argument exception
     * @memberOf! Validation
     * @type {object}
     */
    function IllegalArgumentException(message) {
        this.message = message;
    }

    /**
     * Helper function for validateArguments. Checks the arguments
     * and ensures that none of them are undefined and that the length
     * matches the parameter length
     *
     * @memberOf Validation
     * @param args {arguments} Arguments property of the function we
     * are validating
     * @param len {number} How long the arguments array should be
     */
    function validateLenAndDefined(args, len) {

        if (!args || args.length !== len)
            return false;

        let undefFlag = true;
        args.forEach(function(obj) {
            if (obj === null || obj === undefined)
                undefFlag = false;
        });

        return undefFlag;

    }

    /**
     * Helper function for validateArguments. Checks the arguments against
     * the array of types and makes sure the types are correct
     *
     * @memberOf Validation
     * @param args {arguments} Arguments property of the function we
     * are validating
     * @param types {Array} Array of types to check against arguments. These
     * should be strings of javascript types or validation instance functions.
     * e.g. ['string', 'number', 'object']
     * @returns {number} Index of the invalid argument, -1 if none
     */
    function validateArgumentTypes(args, types) {

        let i = 0,
            ret = -1,
            done = false;
        args.forEach(function(arg) {

            if (done) return;

            if (typeof types[i] === 'function') {
                if (!(types[i].call(args[i]))) {
                    console.warn('args[' + i + '] is not valid according to ' + (types[i].name ? types[i].name : 'an instance function'));
                    ret = i;
                    done = true;
                }

            }
            else if (typeof types[i] === 'string' ||
                     typeof types[i] === 'object') {
                if (!(typeof args[i] === types[i])) {
                    ret = i;
                    done = true;
                }
            }
            else {
                if (!args[i] || !types[i]) {
                    console.warn('args[' + i + '] is not valid according to an instance boolean, or types[' + i + '] is not defined');
                    ret = i;
                    done = true;
                }
            }

            i++;
        });

        return ret;

    }

    /**
     * Takes an arguments object, an array of types, and a function
     * and verifies that the number of arguments matches the number of
     * types, that all arguments are defined, and that all arguments
     * match their respective type in the "types" array. If an instance
     * validation function is passed, it will be used for type validation.
     * If something is invalid, an appropriate error is thrown.
     *
     * @memberOf Validation
     * @param args {arguments} Arguments property of the function we
     * are validating
     * @param types {Array} Array of types to check against arguments. These
     * should be strings of javascript types or validation instance functions.
     * e.g. ['string', 'number', 'object']
     * @param func {function} The function we are validating
     */
    function validateArguments(args, types, func) {

        args = Array.prototype.slice.call(args);

        if (validateLenAndDefined(args, func.length)) {
            let paramNames = getParams(func);

            let i = validateArgumentTypes(args, types);

            if (i >= 0) {

                let str;
                if (types[i] && !(typeof types[i] === 'function'))
                    str = 'param ' + paramNames[i] + ' is not a valid ' + types[i];
                else str = 'param ' + paramNames[i] + ' is not valid';

                throw new IllegalArgumentException(str);
            }

        }
        else throw new IllegalArgumentException('Undefined or missing arguments');

    }

    return {
        validateArguments: validateArguments
    }
})(window, undefined);
