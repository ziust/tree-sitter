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
      $.enum_declaration,
      $.type_declaration,
      $.trait_declaration,
      $.impl_declaration,
      $.const_declaration,
      $.fn_declaration,
    ),

    statement: $ => choice(
      $.struct_declaration,
      $.enum_declaration,
      $.type_declaration,
      $.trait_declaration,
      $.impl_declaration,
      $.const_declaration,
      $.fn_declaration,
      $.let_declaration,
      $.expression_statement,
    ),

    struct_declaration: $ => seq(
      optional('pub'),
      'struct',
      $.identifier,
      optional($.template_parameters),
      optional($.generic_parameters),
      choice(
        seq(
          '{',
          repeat($.struct_member_declaration),
          '}',
        ),
        ';',
      ),
    ),

    struct_member_declaration: $ => seq(
      $.identifier,
      ':',
      $.type,
      ',',
    ),

    enum_declaration: $ => seq(
      optional('pub'),
      'enum',
      $.identifier,
      optional($.enum_member_declaration_parameter),
      optional($.template_parameters),
      optional($.generic_parameters),
      '{',
      repeat($.enum_member_declaration),
      '}',
    ),

    enum_member_declaration_parameter: $ => seq(
      '(',
      $.identifier,
      ')',
    ),

    enum_member_declaration: $ => seq(
      $.identifier,
      optional($.enum_member_parameters),
      optional(seq(
        '=',
        $.number,
        // TODO: add comptime reference?
      )),
      ',',
    ),

    enum_member_parameters: $ => seq(
      '(',
      separatedRepeat1($.type),
      ')',
    ),

    type_declaration: $ => seq(
      optional('pub'),
      'type',
      $.identifier,
      optional($.template_parameters),
      optional($.generic_parameters),
      '=',
      $.type,
      ';',
    ),

    trait_declaration: $ => seq(
      optional('pub'),
      'trait',
      $.identifier,
      optional($.generic_parameters),
      choice(
        seq(
          '{',
          repeat($.trait_member_declaration),
          '}',
        ),
        ';',
      ),
    ),

    trait_member_declaration: $ => choice(
      $.trait_member_declaration_const,
      $.trait_member_declaration_fn,
    ),

    trait_member_declaration_const: $ => seq(
      'const',
      $.identifier,
      ':',
      $.type,
      ';',
    ),

    trait_member_declaration_fn: $ => seq(
      'fn',
      $.identifier,
      optional($.template_parameters),
      optional($.generic_parameters),
      $.fn_parameters,
      ':',
      $.type,
      ';'
    ),

    template_parameters: $ => seq(
      '[',
      separatedRepeat($.template_parameter),
      ']',
    ),

    template_parameter: $ => seq(
      $.identifier,
      optional(seq(
        ':',
        $.template_parameter_or,
      )),
      optional(seq(
        '=',
        $.type,
      )),
    ),

    template_parameter_or: $ => separatedRepeat1($.template_parameter_and, '|'),

    template_parameter_and: $ => separatedRepeat1($.template_parameter_item, '&'),

    template_parameter_item: $ => choice(
      $.template_parameter_parenthesis,
      $.template_parameter_terminal,
    ),

    template_parameter_parenthesis: $ => seq(
      '(',
      $.template_parameter_or,
      ')',
    ),

    template_parameter_terminal: $ => seq(
      $.identifier,
      optional($.template_arguments),
      optional($.generic_arguments),
    ),

    generic_parameters: $ => seq(
      '<',
      separatedRepeat($.generic_parameter),
      '>',
    ),

    generic_parameter: $ => seq(
      $.identifier,
      optional(seq(
        ':',
        $.generic_parameter_and,
      )),
      optional(seq(
        '=',
        $.type,
      )),
    ),

    generic_parameter_and: $ => separatedRepeat1($.generic_parameter_item, '&'),

    generic_parameter_item: $ => choice(
      $.generic_parameter_parenthesis,
      $.generic_parameter_terminal,
    ),

    generic_parameter_parenthesis: $ => seq(
      '(',
      $.generic_parameter_and,
      ')',
    ),

    generic_parameter_terminal: $ => seq(
      $.identifier,
      optional($.generic_arguments),
    ),

    fn_parameters: $ => seq(
      '(',
      separatedRepeat($.fn_parameter),
      ')',
    ),

    fn_parameter: $ => choice(
      seq(
        optional(seq('*', optional(choice('mut', 'const')),)),
        'self',
      ),
      seq(
        $.identifier,
        ':',
        $.type,
      )
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
      optional(choice('mut', 'const')),
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
      optional(choice('mut', 'const')),
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

    fn_arguments: $ => seq(
      '(',
      separatedRepeat($.expression),
      ')',
    ),

    impl_declaration: $ => seq(
      optional($.template_parameters),
      optional($.generic_parameters),
      'impl',
      $.type,
      optional(seq(
        'for',
        $.type,
      )),
      '{',
      repeat($.impl_member_declaration),
      '}',
    ),

    impl_member_declaration: $ => choice(
      $.const_declaration,
      $.fn_declaration,
    ),

    const_declaration: $ => seq(
      'const',
      $.identifier,
      optional(seq(
        ':',
        $.type,
      )),
      '=',
      $.expression,
      ';',
    ),

    fn_declaration: $ => seq(
      optional('pub'),
      'fn',
      $.identifier,
      optional($.template_parameters),
      optional($.generic_parameters),
      $.fn_parameters,
      ':',
      $.type,
      $.block_expression,
    ),

    block_expression: $ => seq(
      '{',
      repeat($.statement),
      optional($.expression),
      '}',
    ),

    expression_statement: $ => seq(
      $.expression,
      ';',
    ),

    let_declaration: $ => seq(
      'let',
      $.identifier,
      optional(seq(
        ':',
        $.type,
      )),
      '=',
      $.expression,
      ';',
    ),

    expression: $ => choice(
      $.builtin_function_call_expression,
      $.member_expression,
      // FIXME: add more expressions
      $.literal,
    ),

    builtin_function_call_expression: $ => seq(
      '@',
      $.identifier,
      optional($.template_parameters),
      $.fn_arguments,
    ),

    member_expression: $ => prec.left(seq(
      $.expression,
      '.',
      choice(
        $.identifier,
        '*',
        seq('[', separatedRepeat1($.expression), ']'),
        $.fn_arguments,
      ),
    )),

    literal: $ => choice(
      $.value_literal,
      $.object_literal,
      $.fn_arguments,
      $.array_literal,
    ),

    object_literal: $ => seq(
      $.identifier,
      optional(seq(
        ':',
        ':',
        optional($.template_parameters),
        optional($.generic_parameters),
      )),
      '{',
      separatedRepeat($.object_literal_member),
      '}',
    ),

    object_literal_member: $ => choice(
      $.object_literal_member_field,
      $.object_literal_member_spread,
    ),

    object_literal_member_field: $ => seq(
      $.identifier,
      optional(seq(
        ':',
        $.expression,
      )),
    ),

    object_literal_member_spread: $ => seq(
      '.',
      '.',
      $.expression,
    ),

    array_literal: $ => seq(
      '[',
      separatedRepeat($.expression),
      ']',
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
