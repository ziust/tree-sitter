/**
 * @file Ziust grammar for tree-sitter
 * @author Juyeong Maing <mjy9088@naver.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * @param {Rule} rule
 * @param {String} fieldName
 * @param {String} sep
 * @returns {Rule}
 */
function separatedRepeat1(rule, fieldName, sep = ',') {
  return seq(
    field(fieldName, rule),
    repeat(seq(
      sep,
      field(fieldName, rule),
    )),
    optional(sep),
  );
}

/**
 * @param {Rule} rule
 * @param {String} fieldName
 * @param {String} sep
 * @returns {Rule}
 */
function separatedRepeat(rule, fieldName, sep = ',') {
  return optional(separatedRepeat1(rule, fieldName, sep));
}

module.exports = grammar({
  name: "ziust",

  rules: {
    // TODO: add the actual grammar rules
    // Basic tokens
    identifier: _ => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    number: _ => /0|[1-9]\d*(\\.\d+)?([eE]-?\d+)?|0[bB][01]+|0[oO][0-7]+|0[xX][0-9a-f]+/,
    string: _ => /"([^"\\]|\\.)*"/,
    value_literal: _ => /true|false|null|undefined/,
    comment: _ => token(choice(
      seq('//', /[^\r\n]*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/',
      ),
    )),
  }
});
