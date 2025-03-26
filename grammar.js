/**
 * @file Ziust grammar for tree-sitter
 * @author Juyeong Maing <mjy9088@naver.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * @param {Rule} rule
 * @param {String} sep
 * @returns {Rule}
 */
function separatedRepeat1(rule, sep = ',') {
  return seq(
    rule,
    repeat(seq(
      sep,
      rule,
    )),
    optional(sep),
  );
}

/**
 * @param {Rule} rule
 * @param {String} sep
 * @returns {Rule}
 */
function separatedRepeat(rule, sep = ',') {
  return optional(separatedRepeat1(rule, sep));
}

module.exports = grammar({
  name: "ziust",

  word: $ => $.identifier,

  extras: $ => [
    $.comment,
    /\s/,
  ],

  rules: {
    program: $ => repeat($.top_level_statement),

    top_level_statement: $ => choice(
      $.struct_declaration,
    ),

    statement: $ => choice(
      $.struct_declaration,
    ),

    struct_declaration: $ => seq(
      optional('pub'),
      'struct',
      $.identifier,
      optional($.template_parameters),
      optional($.generic_parameters),
      '{',
      separatedRepeat($.struct_member_declaration, ';'),
      '}',
    ),

    template_parameters: $ => seq(
      '[',
      separatedRepeat($.type_parameter),
      ']',
    ),

    generic_parameters: $ => seq(
      '<',
      separatedRepeat($.type_parameter),
      '>',
    ),

    type_parameter: $ => seq(
      $.identifier,
      optional(seq(
        ':',
        $.type_parameter_or,
      )),
    ),

    type_parameter_or: $ => separatedRepeat1($.type_parameter_and, '|'),

    type_parameter_and: $ => separatedRepeat1($.type_parameter_item, '&'),

    type_parameter_item: $ => choice(
      $.type_parameter_parenthesis,
      $.type_parameter_terminal,
    ),

    type_parameter_parenthesis: $ => seq(
      '(',
      $.type_parameter_or,
      ')',
    ),

    type_parameter_terminal: $ => seq(
      $.identifier,
      optional($.generic_arguments),
    ),

    struct_member_declaration: $ => seq(
      $.identifier,
      ':',
      $.type,
    ),

    type: $ => choice(
      $.type_tuple,
      $.type_pointer,
      $.type_array,
      $.type_terminal,
    ),

    type_tuple: $ => seq(
      '(',
      separatedRepeat($.type),
      ')',
    ),

    type_pointer: $ => seq(
      '*',
      choice('mut', 'const'),
      $.type,
    ),

    type_array: $ => seq(
      '[',
      optional(choice(
        '*',
        $.number,
        // TODO: add comptime reference?
      )),
      ']',
      choice('mut', 'const'),
      $.type,
    ),

    type_terminal: $ => seq(
      $.identifier,
      optional($.template_arguments),
      optional($.generic_arguments),
    ),

    template_arguments: $ => seq(
      '[',
      separatedRepeat($.type),
      ']',
    ),

    generic_arguments: $ => seq(
      '<',
      separatedRepeat($.type),
      '>',
    ),

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
