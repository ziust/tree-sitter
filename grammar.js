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
function separatedRepeat1(rule, sep = ',', allowTrailing = true) {
  return seq(...[
    rule,
    repeat(seq(
      sep,
      rule,
    )),
    ...(allowTrailing ? [optional(sep)] : []),
  ]);
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

  precedences: $ => [
    [$.as_expression, $.return_expression], // return A as B
    [$.as_expression, $.break_expression], // break A as B
  ],

  conflicts: $ => [
    [$.const_reference_member, $.simple_expression], // ident.ident

    // expression as statement
    [$.block_statement, $.block_expression],
    [$.if_statement, $.expression],
    [$.loop_statement, $.expression],
    [$.match_statement, $.expression],

    // if let a = return { ...
    [$.return_expression],
    [$.break_expression],
    [$.continue_expression],

    [$.const_reference, $.template_parameter], // `impl[_] T {` or `impl [_]const T {`
    [$.let_declaration, $.pattern], // let and let-else
  ],

  rules: {
    // top level module
    module: $ => repeat($.statement),

    // statements are blocks, or ends with ';'
    statement: $ => choice(
      $.struct_declaration,
      $.enum_declaration,
      $.type_declaration,
      $.trait_declaration,
      $.impl_declaration,
      $.const_declaration,
      $.fn_declaration,
      $.let_declaration,
      $.let_else_declaration,
      $.null_statement,
      $.deferrable_statement,
      $.defer_statement,
      $.test_statement,
      $.attribute_statement,
    ),

    // only deferrable_statements can be used after 'defer'
    deferrable_statement: $ => choice(
      $.block_statement,
      $.expression_statement,
      $.assignment_statement,
      $.if_statement,
      $.for_statement,
      $.while_statement,
      $.loop_statement,
      $.match_statement,
    ),

    // struct is user-defined data type that may contain multiple members
    struct_declaration: $ => seq(
      optional('pub'), // pub to make this struct visible to others
      'struct',
      $.identifier, // struct name
      optional($.template_parameters), // template is like in C++
      optional($.generic_parameters), // generic is like in Java
      choice(
        seq(
          '{',
          repeat($.struct_member_declaration),
          '}',
        ),
        ';', // empty struct for type to be used as other template argument
      ),
    ),

    struct_member_declaration: $ => seq(
      repeat($.attribute), // per-member attributes
      optional('pub'), // pub to make this member visible in other modules
      $.identifier, // member name
      ':',
      $.type,
      ',',
    ),

    // enum is a tagged union represents one of several variants
    enum_declaration: $ => seq(
      optional('pub'),
      'enum',
      $.identifier, // enum name
      optional($.enum_member_declaration_parameter), // enum tag type
      optional($.template_parameters),
      optional($.generic_parameters),
      '{',
      repeat($.enum_member_declaration),
      '}',
    ),

    // (u8) in `enum MyEnum(u8) { MAX = 255 }`
    enum_member_declaration_parameter: $ => seq(
      '(',
      $.const_reference,
      ')',
    ),

    enum_member_declaration: $ => seq(
      repeat($.attribute), // per-variant attributes
      $.identifier, // variant name
      optional($.enum_member_parameters), // per-variant data
      optional(seq(
        '=',
        $.expression, // enum tag value
      )),
      ',',
    ),

    // (T) in `enum Option[T] { None, Some(T), }`
    enum_member_parameters: $ => seq(
      '(',
      separatedRepeat1($.type),
      ')',
    ),

    // reference to compile time constants such as type, constant value
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

    // type alias for struct, enum, trait, tuple, reference, pointer, array, ...
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

    // trait is like interface allows polymorphism
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

    // trait may force types to have some constant variables and/or functions
    trait_member_declaration: $ => choice(
      $.trait_member_declaration_const,
      $.trait_member_declaration_fn,
    ),

    trait_member_declaration_const: $ => seq(
      repeat($.attribute),
      'const',
      $.identifier,
      ':',
      $.type,
      ';',
    ),

    trait_member_declaration_fn: $ => seq(
      repeat($.attribute),
      'fn',
      $.identifier,
      optional($.template_parameters),
      optional($.generic_parameters),
      $.fn_parameters,
      ':',
      $.type,
      ';',
    ),

    // contents in template will be generated for each of their usage
    template_parameters: $ => seq(
      '[',
      separatedRepeat1($.template_parameter),
      ']',
    ),

    // each template parameter can be combination of traits or concrete types
    template_parameter: $ => seq(
      $.identifier,
      optional(seq(
        ':',
        $.template_parameter_or,
      )),
      optional(seq(
        '=', // default type
        $.type,
      )),
    ),

    // or-parameter will be checked for each member
    template_parameter_or: $ => separatedRepeat1($.template_parameter_and, '|', false),

    // and-parameter may contain traits only
    template_parameter_and: $ => separatedRepeat1($.template_parameter_item, '&', false),

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

    // contents of generic will not be generated for each of their usage,
    // so it can be combination of traits by and only, or tuple of this recursively
    generic_parameters: $ => seq(
      '<',
      separatedRepeat1($.generic_parameter),
      '>',
    ),

    generic_parameter: $ => seq(
      $.identifier,
      optional(seq(
        ':',
        $.generic_argument,
      )),
      optional(seq(
        '=',
        $.generic_argument,
      )),
    ),

    fn_parameters: $ => seq(
      '(',
      separatedRepeat($.fn_parameter),
      ')',
    ),

    fn_parameter: $ => choice(
      // self (must be first parameter)
      seq(
        optional(seq(choice('&', '*'), choice('mut', 'const'))),
        'self',
      ),
      // other
      seq(
        $.identifier,
        ':',
        $.type,
      ),
    ),

    type: $ => choice(
      '!', // never
      $.type_item,
    ),

    type_item: $ => choice(
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
      choice('!', '?'),
      choice('mut', 'const'),
      $.type_item,
    ),

    type_pointer: $ => seq(
      '*',
      choice('!', '?'),
      choice('mut', 'const'),
      $.type_item,
    ),

    type_array: $ => seq(
      '[',
      optional(choice(
        '*',
        $.expression,
      )),
      ']',
      choice('mut', 'const'),
      $.type_item,
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
      separatedRepeat($.generic_argument),
      '>',
    ),

    // terminal: points single vtable, tuple: points array of multiple vtables
    generic_argument: $ => choice(
      $.generic_argument_terminal,
      $.generic_argument_tuple,
    ),

    generic_argument_tuple: $ => seq(
      '(',
      separatedRepeat1($.generic_argument),
      ')',
    ),

    generic_argument_terminal: $ => separatedRepeat1($.generic_argument_terminal_item, '&', false),

    generic_argument_terminal_item: $ => seq(
      $.const_reference,
      optional($.generic_arguments),
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
      optional('mut'),
      $.identifier,
      optional(seq(
        ':',
        $.type,
      )),
      '=',
      $.expression,
      ';',
    ),

    let_else_declaration: $ => seq(
      $.if_condition_let,
      'else',
      $.block_expression,
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
      optional(seq(':', separatedRepeat1($.label, ',', false))),
      optional($.label),
      $.deferrable_statement,
    ),

    test_statement: $ => seq(
      'test',
      $.string,
      '{',
      repeat($.statement),
      '}',
    ),

    attribute_statement: $ => seq(
      $.attribute,
      $.statement,
    ),

    attribute: $ => seq(
      '!',
      '[',
      separatedRepeat1($.attribute_member),
      ']',
    ),

    attribute_member: $ => seq(
      $.const_reference,
      optional($.group),
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
      $.and_expression,
      $.or_expression,
      $.as_expression,
    ),

    simple_expression: $ => choice(
      $.literal,
      $.parenthesised_expression,
      $.builtin_function_call_expression,
      $.macro_call,
      $.member_expression,
      $.const_reference,
    ),

    parenthesised_expression: $ => seq(
      '(',
      $.expression,
      ')',
    ),

    builtin_function_call_expression: $ => seq(
      '@',
      $.identifier,
      optional($.template_parameters),
      $.fn_arguments,
    ),

    macro_call: $ => seq(
      $.const_reference,
      '!',
      $.group,
    ),

    group: $ => choice(
      $.group_parenthesis,
      $.group_brace,
      $.group_square_bracket,
      $.group_angle_bracket,
    ),

    group_parenthesis: $ => seq(
      '(',
      repeat($.group_parenthesis_content),
      ')',
    ),

    group_parenthesis_content: $ => choice(
      $.group_parenthesis,
      $.string,
      /[^()"]+/,
    ),

    group_brace: $ => seq(
      '{',
      repeat($.group_brace_content),
      '}',
    ),

    group_brace_content: $ => choice(
      $.group_brace,
      $.string,
      /[^{}"]+/,
    ),

    group_square_bracket: $ => seq(
      '[',
      repeat($.group_square_bracket_content),
      ']',
    ),

    group_square_bracket_content: $ => choice(
      $.group_square_bracket,
      $.string,
      /[^\[\]"]+/,
    ),

    group_angle_bracket: $ => seq(
      '<',
      repeat($.group_angle_bracket_content),
      '>',
    ),

    group_angle_bracket_content: $ => choice(
      $.group_angle_bracket,
      $.string,
      /[^<>"]+/,
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

    if_expression: $ => prec.left(seq(
      optional('const'),
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
    )),

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
      '}',
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
      optional(seq(':', $.label)),
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

    and_expression: $ => seq(
      $.simple_expression,
      '&&',
      $.simple_expression,
    ),

    or_expression: $ => seq(
      $.simple_expression,
      '||',
      $.simple_expression,
    ),

    as_expression: $ => seq(
      $.expression,
      'as',
      $.type,
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
      $.tuple_literal,
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

    tuple_literal: $ => seq(
      '#',
      '(',
      separatedRepeat($.expression),
      ')',
    ),

    array_literal: $ => seq(
      '#',
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
