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

  conflicts: $ => [
    [$.const_reference_member, $.expression_body],
    [$.if_statement, $.expression],
  ],

  rules: {
    program: $ => repeat($.statement),

    statement: $ => choice(
      $.struct_declaration,
      $.enum_declaration,
      $.type_declaration,
      $.trait_declaration,
      $.impl_declaration,
      $.const_declaration,
      $.fn_declaration,
      $.let_declaration,
      $.null_statement,
      $.expression_statement,
      $.assignment_statement,
      $.if_statement,
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
      $.const_reference,
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

    const_reference: $ => choice(
      $.const_reference_member,
      $.identifier,
    ),

    const_reference_member: $ => prec.left(seq(
      $.const_reference,
      '.',
      choice(
        $.identifier,
        $.number,
      ),
    )),

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
      optional($.template_parameters),
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
      separatedRepeat1($.template_parameter),
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
      $.const_reference,
      optional($.template_arguments),
      optional($.generic_arguments),
    ),

    generic_parameters: $ => seq(
      '<',
      separatedRepeat1($.generic_parameter),
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
      $.const_reference,
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
      $.const_reference,
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
      'impl',
      optional($.template_parameters),
      optional($.generic_parameters),
      optional(seq(
        $.type,
        'for',
      )),
      $.type,
      '{',
      repeat($.impl_member_declaration),
      '}',
    ),

    impl_member_declaration: $ => choice(
      $.const_declaration,
      $.fn_declaration,
    ),

    const_declaration: $ => seq(
      optional('pub'),
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

    null_statement: _ => ';',

    expression_statement: $ => seq(
      $.expression,
      ';',
    ),

    assignment_statement: $ => seq(
      $.expression,
      '=',
      $.expression,
      ';',
    ),

    if_statement: $ => $.if_expression,

    expression: $ => choice(
      seq($.expression_body, optional($.turbofish)),
      $.block_expression,
      $.if_expression,
      // FIXME: add more expressions
      $.literal,
    ),

    expression_body: $ => choice(
      $.builtin_function_call_expression,
      $.member_expression,
      $.const_reference,
    ),

    builtin_function_call_expression: $ => seq(
      '@',
      $.identifier,
      optional($.template_parameters),
      $.fn_arguments,
    ),

    member_expression: $ => prec.left(seq(
      $.expression_body,
      choice(
        seq('.', $.identifier),
        seq('.', '*'),
        seq('.', '&'),
        seq('.', $.number),
        seq('[', separatedRepeat1($.expression), ']'),
        seq(optional($.turbofish), $.fn_arguments),
      ),
    )),

    turbofish: $ => seq(
      '::',
      choice(
        seq($.template_parameters, optional($.generic_parameters)),
        $.generic_parameters
      ),
    ),

    if_expression: $ => seq(
      'if',
      $.if_condition,
      $.block_expression,
      repeat(seq(
        'else',
        'if',
        $.if_condition,
        $.block_expression,
      )),
      optional(seq(
        'else',
        $.block_expression,
      )),
    ),

    if_condition: $ => choice(
      $.if_condition_let,
      $.expression,
    ),

    if_condition_let: $ => seq(
      'let',
      $.pattern,
      '=',
      $.expression,
    ),

    pattern: $ => choice(
      $.identifier,
      $.pattern_enum,
      $.pattern_struct,
    ),

    pattern_enum: $ => seq(
      $.const_reference,
      '(',
      separatedRepeat1($.pattern),
      ')',
    ),

    pattern_struct: $ => seq(
      $.const_reference,
      '{',
      separatedRepeat1($.pattern_struct_member),
      '}',
    ),

    pattern_struct_member: $ => seq(
      $.identifier,
      optional(seq(
        ':',
        $.pattern,
      )),
    ),

    literal: $ => choice(
      $.number,
      $.string,
      $.value_literal,
      $.struct_literal,
      $.fn_arguments,
      $.array_literal,
    ),

    struct_literal: $ => seq(
      '#',
      optional(seq(
        $.const_reference,
        optional($.turbofish),
      )),
      '{',
      separatedRepeat($.struct_literal_member),
      '}',
    ),

    struct_literal_member: $ => choice(
      $.struct_literal_member_field,
      $.struct_literal_member_spread,
    ),

    struct_literal_member_field: $ => seq(
      $.identifier,
      optional(seq(
        ':',
        $.expression,
      )),
    ),

    struct_literal_member_spread: $ => seq(
      '..',
      $.expression,
    ),

    array_literal: $ => seq(
      '[',
      separatedRepeat($.expression),
      ']',
    ),

    // Basic tokens
    identifier: _ => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    number: _ => /(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?|0[bB][01]+|0[oO][0-7]+|0[xX][0-9a-f]+/,
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
