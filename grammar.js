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
    [$.const_reference_member, $.simple_expression],
    [$.block_statement, $.expression],
    [$.if_statement, $.expression],
    [$.loop_statement, $.expression],
    [$.match_statement, $.expression],
    [$.return_expression],
    [$.break_expression],
    [$.continue_expression],
    [$.const_reference, $.template_parameter],
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
      $.deferrable_statement,
      $.defer_statement,
      $.errdefer_statement,
    ),

    deferrable_statement: $ => choice(
      $.expression_statement,
      $.assignment_statement,
      $.if_statement,
      $.for_statement,
      $.while_statement,
      $.loop_statement,
      $.match_statement,
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
        $.expression,
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
        $.generic_parameter_item,
      )),
      optional(seq(
        '=',
        $.type,
      )),
    ),

    generic_parameter_item: $ => choice(
      $.generic_parameter_tuple,
      $.generic_parameter_terminal,
    ),

    generic_parameter_tuple: $ => seq(
      '(',
      separatedRepeat1($.generic_parameter_terminal),
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
        optional(seq('&', choice('mut', 'const'),)),
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
      $.type_reference,
      $.type_pointer,
      $.type_array,
      $.type_terminal,
    ),

    type_tuple: $ => seq(
      '(',
      separatedRepeat($.type),
      ')',
    ),

    type_reference: $ => seq(
      '&',
      choice('mut', 'const'),
      $.type,
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
        $.expression,
      )),
      ']',
      choice('mut', 'const'),
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
      optional(seq($.label, ':')),
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

    block_statement: $ => seq(
      optional(seq($.label, ':')),
      '{',
      repeat($.statement),
      '}',
    ),

    if_statement: $ => $.if_expression,

    for_statement: $ => seq(
      'for',
      $.pattern,
      'in',
      $.simple_expression,
      $.block_expression,
    ),

    while_statement: $ => seq(
      'while',
      $.simple_expression,
      $.block_expression,
    ),

    loop_statement: $ => $.loop_expression,

    match_statement: $ => $.match_expression,

    defer_statement: $ => seq(
      'defer',
      optional($.label),
      $.deferrable_statement,
    ),

    errdefer_statement: $ => seq(
      'errdefer',
      $.deferrable_statement,
    ),

    expression: $ => choice(
      $.simple_expression,
      $.block_expression,
      $.if_expression,
      $.loop_expression,
      $.match_expression,
      $.return_expression,
      $.break_expression,
      $.continue_expression,
      // FIXME: add more expressions
    ),

    simple_expression: $ => choice(
      $.literal,
      $.builtin_function_call_expression,
      $.macro_call,
      $.member_expression,
      $.const_reference,
    ),

    builtin_function_call_expression: $ => seq(
      '@',
      $.identifier,
      optional($.template_parameters),
      $.fn_arguments,
    ),

    macro_call: $ => choice(
      $.macro_call_parenthesis,
      $.macro_call_brace,
      $.macro_call_square_bracket,
      $.macro_call_angle_bracket,
    ),

    macro_call_parenthesis: $ => seq(
      $.const_reference,
      '!',
      $.group_parenthesis,
    ),

    group_parenthesis: $ => seq(
      '(',
      repeat($.group_parenthesis_content),
      ')',
    ),

    group_parenthesis_content: $ => choice(
      $.group_parenthesis,
      /[^()]+/,
    ),

    macro_call_brace: $ => seq(
      $.const_reference,
      '!',
      $.group_brace,
    ),

    group_brace: $ => seq(
      '{',
      repeat($.group_brace_content),
      '}',
    ),

    group_brace_content: $ => choice(
      $.group_brace,
      /[^{}]+/,
    ),

    macro_call_square_bracket: $ => seq(
      $.const_reference,
      '!',
      $.group_square_bracket,
    ),

    group_square_bracket: $ => seq(
      '[',
      repeat($.group_square_bracket_content),
      ']',
    ),

    group_square_bracket_content: $ => choice(
      $.group_square_bracket,
      /[^\[\]]+/,
    ),

    macro_call_angle_bracket: $ => seq(
      $.const_reference,
      '!',
      $.group_angle_bracket,
    ),

    group_angle_bracket: $ => seq(
      '<',
      repeat($.group_angle_bracket_content),
      '>',
    ),

    group_angle_bracket_content: $ => choice(
      $.group_angle_bracket,
      /[^<>]+/,
    ),

    member_expression: $ => prec.left(seq(
      $.simple_expression,
      choice(
        seq('.', $.identifier, optional($.turbofish)),
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
      $.simple_expression,
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

    loop_expression: $ => seq(
      'loop',
      optional(seq($.label, ':')),
      '{',
      repeat($.statement),
      '}'
    ),

    match_expression: $ => seq(
      'match',
      $.simple_expression,
      optional(seq($.label, ':')),
      '{',
      repeat($.match_arm),
      '}',
    ),

    match_arm: $ => seq(
      $.pattern,
      optional(seq(
        'if',
        $.simple_expression,
      )),
      '=>',
      $.expression,
      ',',
    ),

    return_expression: $ => seq(
      'return',
      optional($.expression),
    ),

    break_expression: $ => seq(
      'break',
      optional($.label),
      optional($.expression),
    ),

    continue_expression: $ => seq(
      'continue',
      optional($.label),
    ),

    label: $ => seq(
      "'",
      $.identifier,
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
